const anchor = require('@project-serum/anchor');
const { randomBytes } = require('crypto');

class Session {
    constructor(keypair, idl, programId, env) {
        this.keypair = keypair;
        this.idl = idl;
        this.programId = programId;
        this.seed = "r-seed";
        this.vaultSeed = "v-seed";

        this.solConnection = new anchor.web3.Connection(env);
        this.walletWrapper = new anchor.Wallet(this.keypair);
        this.provider = new anchor.Provider(this.solConnection, this.walletWrapper, {
            preflightCommitment: 'recent',
        });
        this.program = new anchor.Program(idl, programId, this.provider);
    }

    async getBalance() {
        anchor.setProvider(this.provider);
        return await this.provider.connection.getBalance(this.keypair.publicKey, "confirmed");
    }

    async requestAirdrop(amount=1000000000) {
        anchor.setProvider(this.provider);

        await this.provider.connection.confirmTransaction(
            await this.provider.connection.requestAirdrop(this.keypair.publicKey, amount),
            "confirmed"
        );
    }
}

class UserSession extends Session {
    constructor(keypair, idl, programId, oraclePubkey, env) {
        super(keypair, idl, programId, env);
        this.oraclePubkey = oraclePubkey;
    }

    async setAccounts() {
        anchor.setProvider(this.provider);
        [this.randomAccount, this.randBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(this.seed), this.keypair.publicKey.toBuffer()],
            this.programId
            );

        [this.vaultAccount, this.vaultBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(this.vaultSeed), this.keypair.publicKey.toBuffer()],
            this.programId
            );
    }

    async airdropVaultAccount(amount=1000000000) {
        anchor.setProvider(this.provider);

        await this.provider.connection.confirmTransaction(
            await this.provider.connection.requestAirdrop(this.vaultAccount, amount),
            "confirmed"
        );
    }

    async initializeAccount() {
        anchor.setProvider(this.provider);
        await this.program.rpc.initialize(
            this.randBump,
            this.vaultBump,
            {
                accounts: {
                    requester: this.randomAccount,
                    vault: this.vaultAccount,
                    authority: this.keypair.publicKey,
                    oracle: this.oraclePubkey,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
                signers: [this.keypair],
            }
        );
    }

    async requestRandom() {
        anchor.setProvider(this.provider);
        await this.program.rpc.requestRandom({
            accounts: {
                requester: this.randomAccount,
                vault: this.vaultAccount,
                authority: this.keypair.publicKey,
                oracle: this.oraclePubkey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [this.keypair],
        });
    }
}

class MockOracleSession extends Session {
    constructor(keypair, idl, programId, env) {
        super(keypair, idl, programId, env);
    }

    async publishRandom(requester, randomNumber=randomBytes(64)) {
        let pktId = randomBytes(32);
        let tlsId = randomBytes(32);

        anchor.setProvider(this.provider);
        await this.program.rpc.publishRandom(
            randomNumber,
            pktId,
            tlsId, 
            {
                accounts: {
                    oracle: this.keypair.publicKey,
                    requester: requester.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
                remainingAccounts: [
                    {
                        pubkey: requester.publicKey,
                        isWritable: true,
                        isSigner: false,
                    },
                ],
                signers: [this.keypair],
            },
        );
    }
}


module.exports = { UserSession, MockOracleSession }