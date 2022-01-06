const { UserSession, MockOracleSession } = require("./sessions.js");

const SOLRAND_IDL = require("../target/idl/solrand.json");
const PROGRAM_ID = "GxJJd3q28eUd7kpPCbNXGeixqHmBYJ2owqUYqse3ZrGS";
const ORACLE_DEVNET = "qkyoiJyAtt7dzaUTsiQYYyGRrnJL3AE1mP93bmFXpY8";

module.exports = { UserSession, MockOracleSession, SOLRAND_IDL, PROGRAM_ID, ORACLE_DEVNET }