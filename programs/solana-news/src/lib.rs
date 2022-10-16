use anchor_lang::prelude::*;

declare_id!("3DZZTzzjsZurjncMYe6B4DZ35SnxHbUC8TdQkQ7EHYUL");

#[program]
pub mod solana_news {
    use super::*;

    pub fn publish_article(ctx: Context<PublishArticle>, title: String, content: String) -> Result<()> {
        let article: &mut Account<Article> = &mut ctx.accounts.article;

        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if title.chars().count() > 80 {
            return Err(ErrorCode::TitleTooLong.into());
        }

        if content.chars().count() > 2200 {
            return Err(ErrorCode::ContentTooLong.into());
        }


        article.author = *author.key;
        article.timestamp = clock.unix_timestamp;
        article.title = title;
        article.content = content;

        Ok(())
    }

    pub fn view(ctx: Context<ViewArticle>, article: Pubkey) -> Result<()> {
        let view: &mut Account<View> = &mut ctx.accounts.view;
        let viewer: &Signer = &ctx.accounts.viewer;
        let clock: Clock = Clock::get().unwrap();

        view.viewer = *viewer.key;
        view.article = article;

        view.timestamp = clock.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct ViewArticle<'info> {
    #[account(init, payer = viewer, space = View::LEN)]
    pub view: Account<'info, View>,
    #[account(mut)]
    pub viewer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PublishArticle<'info> {
    #[account(init, payer = author, space = Article::LEN)]
    pub article: Account<'info, Article>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}


///Blockchain keeps record of views for each article
#[account]
pub struct View {
    pub article: Pubkey,
    pub viewer: Pubkey,
    pub timestamp: i64,
}

///We are keeping articles into blockchain for this "concept" code but it will be not really efficient, and it makes sense to store only some id or hash
///also every article may be considered as NFT with multiple authors/owners/investors(someone payed for investigation/research and now have a right to use this article in any way)
/// and in addition author may receive payment for citation for example
#[account]
pub struct Article {
    pub author: Pubkey,
    pub timestamp: i64,
    pub title: String,
    pub content: String,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_TITLE_LENGTH: usize = 80 * 4; // 80 chars max.
const MAX_CONTENT_LENGTH: usize = 2200 * 4; // 22000 chars max.

impl Article {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_TITLE_LENGTH // Title.
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content.
}

impl View {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH * 2 // Article and viewer.
        + TIMESTAMP_LENGTH; // Timestamp.
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided title should be 80 characters long maximum.")]
    TitleTooLong,
    #[msg("The provided content should be 2200 characters long maximum.")]
    ContentTooLong,
}