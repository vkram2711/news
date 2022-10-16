import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaNews } from "../target/types/solana_news";
import * as assert from "assert";


//This is test file but it's used as a frontend simulation for concept
describe("solana-news", () => {
  // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SolanaNews as Program<SolanaNews>;
    const author = program.provider.wallet;
    it('publish article', async () => {
        const article = await publishArticle('TEST TITLE', 'TEST CONTENT', program, author.publicKey);
        const articleAccount = await program.account.article.fetch(article.publicKey);
        assert.equal(articleAccount.author.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(articleAccount.title, 'TEST TITLE');
        assert.equal(articleAccount.content, 'TEST CONTENT');
        assert.ok(articleAccount.timestamp);
    });

    //Create a few article to work with
    it('publish a lot articles', async() => {
        await publishArticle('One', 'Content', program, author.publicKey);
        await publishArticle('Two', 'Content', program, author.publicKey);
        await publishArticle('Three', 'Content', program, author.publicKey);
        await publishArticle('Four', 'Content', program, author.publicKey);
        await publishArticle('Five', 'Content', program, author.publicKey);
        await publishArticle('Six', 'Content', program, author.publicKey);
    });

    //View three random articles
    it('view random articles', async () => {
        for (let i = 0; i < 3; i++) {
            const articles = await program.account.article.all();
            const articleNumber = Math.floor(Math.random() * (articles.length));

            const article = articles[articleNumber];
            await viewArticle(article.publicKey, program, author.publicKey);
        }
   });

    //Platform makes money not from mining but from selling services like subscriptions or ads or hiring writers
    //Every month/week/whatever there is a payday when author can convert their views into money
    //In perfect solution it would be some crypto coin with emission when new authors joining
    //Then during payday they are selling their coins and receiving money.
    //If someone sells someone must buy. Buyers are ads providers or subscribers or any other finance model
    //Technically authors selling their skills and time and monetization provider
    //and then this providers are selling coins back to authors but receiving views not money
    //
    //As coin holder author pretend on a share from the total bank from monetization
    it('payday', async () => {
        //let's say our platform made 100$ from ads and subscriptions this month
        const bank = 100;
        const views = await program.account.view.all();
        let views_per_author: Map<string, number> = new Map();
        const overall_views = views.length;

        for (let i = 0; i < views.length; i++) {
            const view = views[i];



            const article = await program.account.article.fetch(view.account.article);

            const author = article.author.toBase58();
            if(views_per_author.has(author)){
                views_per_author.set(author, views_per_author.get(author) + 1);
            } else {
               views_per_author.set(author, 1);
            }
        }
        console.log(views_per_author)
        views_per_author.forEach((value, key) => {
            console.log("Author: " + key + " has " + value + " views which is " + (value/overall_views*100) + "% of views this month and revenue:" + (bank*(value/overall_views)) + "$")
        });


    });
});


async function viewArticle(article: PublicKey, program:Program<SolanaNews>, viewer:PublicKey) {
    const view = generateKeypair();
    await program.rpc.view(article, {
        accounts: {
            view: view.publicKey,
            viewer: viewer,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [view],
    });
    return view;
}

async function publishArticle(title:string, content:string, program:Program<SolanaNews>, author:PublicKey) {
    const article = generateKeypair();
    await program.rpc.publishArticle(title, content, {
        accounts: {
            article: article.publicKey,
            author: author,
            systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [article],
    });
    return article;
}

function generateKeypair() {
    return anchor.web3.Keypair.generate();
}