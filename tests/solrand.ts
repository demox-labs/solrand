import * as anchor from '@project-serum/anchor';
import { assert, expect } from "chai";
import { UserSession, MockOracleSession as OracleSession } from "../app/sessions.js";

describe('solrand', () => {
    const ENV = 'http://localhost:8899';
    const AIRDROP = 1000000000;
    const FEE = 495000; // In lamports, defined in lib.rs

    const oracleKeypair = anchor.web3.Keypair.generate();
    const oracleSession = new OracleSession(oracleKeypair, anchor.workspace.Solrand.idl, anchor.workspace.Solrand.programId, ENV);
    const userKeypair = anchor.web3.Keypair.generate();
    const userSession = new UserSession(userKeypair, anchor.workspace.Solrand.idl, anchor.workspace.Solrand.programId, oracleKeypair.publicKey, ENV);
    const notOracleKeypair = anchor.web3.Keypair.generate();
    const notOracleSession = new OracleSession(notOracleKeypair, anchor.workspace.Solrand.idl, anchor.workspace.Solrand.programId, ENV);

    async function getRequester(oraclePubKey) {
        let requesters = await userSession.program.account.requester.all();
        return requesters.filter(req => req.account.oracle.toString() == oraclePubKey.toString());
    }

    it('Setting up tests', async() => {
        await userSession.requestAirdrop(AIRDROP);
        await oracleSession.requestAirdrop(AIRDROP);
        await notOracleSession.requestAirdrop(AIRDROP);

        let userBalance = await userSession.getBalance();
        let oracleBalance = await oracleSession.getBalance();
        let notOracleBalance = await notOracleSession.getBalance();

        assert(userBalance == AIRDROP);
        assert(oracleBalance == AIRDROP);
        assert(notOracleBalance == AIRDROP);
    });

    it('Initializes properly', async () => {
        // Set accounts
        await userSession.setAccounts();

        const beforeBalance = await userSession.getBalance();
        await userSession.initializeAccount();
        const afterBalance = await userSession.getBalance();

        let requesters = await getRequester(oracleKeypair.publicKey);

        assert(requesters.length == 1);
        
        let requester = requesters[0];

        assert(requester.account.count.toNumber() == 0);
        assert(requester.account.authority.toString() == userKeypair.publicKey.toString());
        assert(!requester.account.activeRequest);

        console.log(`Cost of initialization is ${beforeBalance - afterBalance}`);
    });

    it('Creates a random request', async () => {
        const beforeBalance = await userSession.getBalance();
        const oldOracleBalance = await oracleSession.getBalance();
        await userSession.requestRandom();
        const afterBalance = await userSession.getBalance();
        const newOracleBalance = await oracleSession.getBalance();

        let requesters = await getRequester(oracleKeypair.publicKey);

        assert(requesters.length == 1);
        
        let requester = requesters[0];
        assert(requester.account.count.toNumber() == 1); // Before 0, now 1
        assert(requester.account.authority.toString() == userKeypair.publicKey.toString()); // Still the same owner
        assert(requester.account.activeRequest); // Now true

        console.log(`Cost of request is ${beforeBalance - afterBalance}`);
        assert((newOracleBalance - oldOracleBalance) == FEE);
    });

    it('Cannot make multiple requests in a row', async () => {
        try {
            await userSession.requestRandom();
        } catch (e) {
            assert(e.message.includes('0x12e'));
        }
    });

    it('Wrong Oracle cannot respond to request', async () => {
        let requesters = await getRequester(oracleKeypair.publicKey);

        assert(requesters.length == 1);

        try {
            await notOracleSession.publishRandom(requesters[0]);
        } catch (e) {
            assert(e.message.includes('0x12c'));
        }
    });

    it('Oracle can respond to request', async () => {
        let requesters = await getRequester(oracleKeypair.publicKey);

        assert(requesters.length == 1);

        const oldOracleBalance = await oracleSession.getBalance();
        await oracleSession.publishRandom(requesters[0]);
        const newOracleBalance = await oracleSession.getBalance();

        requesters =await getRequester(oracleKeypair.publicKey);
        assert(requesters.length == 1);
        
        let requester = requesters[0];
        assert(requester.account.count.toNumber() == 1); // Still 1
        assert(requester.account.authority.toString() == userKeypair.publicKey.toString()); // Still the same owner
        assert(!requester.account.activeRequest); // Before true, Now false

        console.log(`Cost of Oracle Response is ${oldOracleBalance - newOracleBalance}`);
    });

    it('Oracle cannot respond multiple times to request', async () => {
        let requesters = await getRequester(oracleKeypair.publicKey);
        try {
            await oracleSession.publishRandom(requesters[0]);
        } catch (e) {
            assert(e.message.includes('0x12d'));
        }
    });
});