use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("8nzxsNf74ZHDguHi51SjQWxDxegL2DBgxeGHA2pQVtTJ");

#[program]
pub mod solrand {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        request_bump: u8,
        uuid: u64,
    ) -> Result<()> {
        let requester = &mut ctx.accounts.requester;
        let clock: Clock = Clock::get().unwrap();

        requester.authority = *ctx.accounts.authority.key;
        requester.oracle = *ctx.accounts.oracle.key;
        requester.created_at = clock.unix_timestamp;
        requester.count = 0;
        requester.active_request = false;
        requester.last_updated = clock.unix_timestamp;
        requester.uuid = uuid;
        requester.bump = request_bump;

        Ok(())
    }

    pub fn request_random(
        ctx: Context<RequestRandom>,
    ) -> Result<()> {
        // Some checks to ensure proper account ownership
        {
            let requester = &mut ctx.accounts.requester;
            let authority = ctx.accounts.authority.key();
    
            if requester.authority != authority {
                return Err(ErrorCode::Unauthorized.into());
            }
    
            if requester.oracle != ctx.accounts.oracle.key() {
                return Err(ErrorCode::WrongOracle.into());
            }
    
            if requester.active_request {
                return Err(ErrorCode::InflightRequest.into());
            }
        }

        // Once the requester has active_request set, it's frozen until the Oracle responds
        {
            let requester = &mut ctx.accounts.requester;
            let clock: Clock = Clock::get().unwrap();

            requester.last_updated = clock.unix_timestamp;
            requester.active_request = true;
            requester.count += 1;
        }

        emit!(RandomRequested {
            requester: ctx.accounts.requester.to_account_info().key()
        });
        
        Ok(())
    }

    pub fn publish_random(
        ctx: Context<PublishRandom>,
        random: [u8; 64],
        pkt_id: [u8; 32],
        tls_id: [u8; 32],
    ) -> Result<()> {
        {
            // Have to load the account this way to avoid automated ownership checks
            let requester = &mut ctx.accounts.requester;

            if requester.oracle != ctx.accounts.oracle.key() {
                return Err(ErrorCode::Unauthorized.into());
            }

            if !requester.active_request {
                return Err(ErrorCode::AlreadyCompleted.into())
            }
            let clock: Clock = Clock::get().unwrap();

            requester.last_updated = clock.unix_timestamp;
            requester.active_request = false;
            requester.random = random;
            requester.pkt_id = pkt_id;
            requester.tls_id = tls_id;
        }

        emit!(RandomPublished {
            requester: ctx.accounts.requester.key()
        });        

        Ok(())
    }

    /**
     * Used by PDAs in CPIs to lock an Oracle request
     */
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>
    ) -> Result<()> {
        let requester = &mut ctx.accounts.requester;

        if requester.authority != ctx.accounts.authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }

        if requester.active_request {
            return Err(ErrorCode::RequesterLocked.into());
        }

        requester.authority = ctx.accounts.new_authority.key();

        Ok(())
    }

    pub fn cancel(
        ctx: Context<Cancel>
    ) -> Result<()> {
        let authority_key = ctx.accounts.authority.key();
        let requester = &mut ctx.accounts.requester;

        if authority_key != requester.authority {
            return Err(ErrorCode::Unauthorized.into());
        }

        if requester.active_request {
            return Err(ErrorCode::RequesterLocked.into());
        }

        Ok(())
    }
}


#[derive(Accounts)]
#[instruction(_request_bump: u8, uuid: u64)]
pub struct Initialize<'info> {
    #[account(
        init, 
        seeds = [b"r-seed".as_ref(), authority.key().as_ref(), &uuid.to_le_bytes()],
        bump,
        payer = authority,
        space = 8 + size_of::<Requester>()
    )]
    pub requester: Account<'info, Requester>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: The client decides the oracle to use
    pub oracle: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Requester {
    pub authority: Pubkey,
    pub oracle: Pubkey,
    pub created_at: i64,
    pub count: u64,
    pub last_updated: i64,
    pub random: [u8; 64],
    pub pkt_id: [u8; 32],
    pub tls_id: [u8; 32],
    pub active_request: bool,
    pub uuid: u64,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct RequestRandom<'info> {
    #[account(mut)]
    pub requester: Account<'info, Requester>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: The client decides the oracle to use
    #[account(mut)]
    pub oracle: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PublishRandom<'info> {
    #[account(mut)]
    pub requester: Account<'info, Requester>,
    pub oracle: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(mut)]
    pub requester: Account<'info, Requester>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: The client decides the new owner
    #[account(mut)]
    pub new_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut, close = authority)]
    pub requester: Account<'info, Requester>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to complete this transaction")]
    Unauthorized,
    #[msg("You have already completed this transaction")]
    AlreadyCompleted,
    #[msg("A request is already in progress. Only one request may be made at a time")]
    InflightRequest,
    #[msg("The Oracle you make the request with must be the same as initialization")]
    WrongOracle,
    #[msg("You cannot change authority of a request awaiting a response")]
    RequesterLocked,
}

#[event]
pub struct RandomRequested {
    pub requester: Pubkey,
}

#[event]
pub struct RandomPublished {
    pub requester: Pubkey,
}