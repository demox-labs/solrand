const { UserSession, MockOracleSession } = require("./app/sessions.js");

const SOLRAND_IDL = require("./app/solrandhypn.json");
const PROGRAM_ID = "CrkGQLM8mnWxUV2bGXacvFtnk3oVyeP6grRyFgu6XJ9G";
const ORACLE_DEVNET = "qkyoiJyAtt7dzaUTsiQYYyGRrnJL3AE1mP93bmFXpY8";

module.exports = { UserSession, MockOracleSession, SOLRAND_IDL, PROGRAM_ID, ORACLE_DEVNET }