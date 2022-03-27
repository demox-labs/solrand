# solrand

An Random Oracle on Solana based on the Demox Protocol. 
The random numbers are provided by Random.org.

This repository implements the Solana program and provides some utilities to make interacting with it easier.

This repository creates the:
* solrand crate (Rust): https://crates.io/crates/solrand
* solrand package on npm (JS): https://www.npmjs.com/package/@demox_labs/solrand

# Installation

1. Ensure that Anchor and all of its dependencies are installed: https://project-serum.github.io/anchor/getting-started/introduction.html
1. `yarn install`
1. Rename the `Anchor.example.toml` to `Anchor.toml` and update the `wallet =` to your solana key.
1. Start the `solana-test-validator`
1. Run `anchor build && anchor deploy`
1. Use the Program Id found from the deploy. Replace `GxJJd3q28eUd7kpPCbNXGeixqHmBYJ2owqUYqse3ZrGS` with your new Program Id.
1. Run the tests: `anchor test`

## Install the crate:
Add `solrand = { version = "0.1.3", features = ["cpi"] }` to your Cargo.toml

## Install the js client library:
`npm i @demox-labs/solrand --save`

# Usage

## For CPI Calls

If you're writing a Solana program to interact with this one, we recommend:
1. Installing & running the `solana-test-validator`
2. Clone & Install this repository with the instructions above.
3. Run `anchor build && anchor deploy` or `anchor test --skip-local-validator` to deploy program to test validator. You'll need to redo this if you ever reset the `solana-test-validator` for example by running it with `-r`.

Now you can run your program using for example:
* `anchor build && anchor deploy && node my-script.js`
* `anchor test --skip-test-validator`

You could alternatively copy the state of devnet and load it locally but full installation is recommended as described.
Any CPI call should test all error states & full installation makes development much easier if you can update the program to force them. 


# Examples

## On chain

The best resource for understanding how to interact with solrand is through the P2P Coin Flip is the example here: https://github.com/evanmarshall/cross-pile

## Client

The tests, `tests/solrand.ts`, provide examples in how to use our client library.

# Security Considerations

1. This code has not been audited by a third party. If you find issues please submit them. We plan get an audit as soon as we can.
2. The random numbers for the Oracle are provided by Random.org. Outages are certainly possible as with any Oracle so we plan to add multiple random sources in the future. Error handling for hanging responses should be a consideration.
3. The Demox Protocol is in its beginning stages and at this point, still requires trust in Demox Labs as a third party. With the launch of our dVPN, no third party need be trusted but for this, it requires trusting that we're not fabricating packet captures and tls sessions. We will publish logs of our Random.Org account as to show usage consistent with that publicly available onchain.

# Troubleshooting

## Problems with Anchor
* The most common problem with anchor is using the right version of node. I recommend install Node through NVM and using `Node v16.11.1`. 
* Anchor may and has introduced breaking changes. The current version is 0.22.0. I recommend installing Anchor Version Manager (AVM) to compile with different versions of Anchor. `cargo install --git https://github.com/project-serum/anchor avm --locked --force`

# License

We use the `GNU Affero General Public License v3.0 or later` license to ensure the community will always have access to all original and derivations of this program.
Full text here: https://spdx.org/licenses/AGPL-3.0-or-later.html
