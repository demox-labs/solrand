const anchor = require('@project-serum/anchor');
const { randomBytes } = require('crypto');

/**
 * Defines a Wrapper around the anchor Program and Provider classes
 * Useful for isolating wallets & simplifying api calls
 */
class Session {
    constructor(keypair, idl, programId, env) {
        this.keypair = keypair;
        this.idl = idl;
        this.programId = programId;
        this.seed = "r-seed";

        this.solConnection = new anchor.web3.Connection(env);
        this.walletWrapper = new anchor.Wallet(this.keypair);
        this.provider = new anchor.AnchorProvider(this.solConnection, this.walletWrapper, {
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

/**
 * Defines a session to interact as the user requesting random information.
 */
class UserSession extends Session {
    constructor(keypair, idl, programId, oraclePubkey, env, uuid) {
        super(keypair, idl, programId, env);
        this.oraclePubkey = oraclePubkey;
        this.uuid = new anchor.BN(uuid);
    }

    /**
     * Create two accounts:
     * Random: Used for storing data
     * Vault: Used for storing lamports
     */
    async setAccounts() {
        anchor.setProvider(this.provider);
        const uuidBytes = this.uuid.toArrayLike(Buffer, 'le', 8);
        [this.reqAccount, this.reqBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from(this.seed), this.keypair.publicKey.toBuffer(), uuidBytes],
            this.programId
            );
    }

    async initializeAccount() {
        anchor.setProvider(this.provider);
        await this.program.methods.initialize(this.reqBump, this.uuid)
            .accounts({
                requester: this.reqAccount,
                authority: this.keypair.publicKey,
                oracle: this.oraclePubkey,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                systemProgram: anchor.web3.SystemProgram.programId
            })
            .signers([this.keypair])
            .rpc();
    }

    async requestRandom() {
        anchor.setProvider(this.provider);
        await this.program.methods.requestRandom()
            .accounts({
                requester: this.reqAccount,
                vault: this.vaultAccount,
                authority: this.keypair.publicKey,
                oracle: this.oraclePubkey,
                systemProgram: anchor.web3.SystemProgram.programId
            })
            .signers([this.keypair])
            .rpc();
    }

    async cancelAccount() {
        anchor.setProvider(this.provider);
        await this.program.methods.cancel()
            .accounts({
                requester: this.reqAccount,
                authority: this.keypair.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([this.keypair])
            .rpc();
    }
}

/**
 * Used for testing & example to deploy your own oracle
 */
class MockOracleSession extends Session {
    constructor(keypair, idl, programId, env) {
        super(keypair, idl, programId, env);
    }

    async publishRandom(requester, randomNumber=randomBytes(64)) {
        let pktId = randomBytes(32);
        let tlsId = randomBytes(32);

        anchor.setProvider(this.provider);
        await this.program.methods.publishRandom(randomNumber, pktId, tlsId)
            .accounts({
                oracle: this.keypair.publicKey,
                requester: requester.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([this.keypair])
            .rpc();
    }
}


module.exports = { UserSession, MockOracleSession }