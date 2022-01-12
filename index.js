const { UserSession, MockOracleSession } = require("./app/sessions.js");

const SOLRAND_IDL = require("./app/solrand.json");
const PROGRAM_ID = "7f7utthxAnEo57p3UTaY6ewYVtQMp2kGkFA3i1C93yry";
const ORACLE_DEVNET = "qkyoiJyAtt7dzaUTsiQYYyGRrnJL3AE1mP93bmFXpY8";

module.exports = { UserSession, MockOracleSession, SOLRAND_IDL, PROGRAM_ID, ORACLE_DEVNET }