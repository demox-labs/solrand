# solrand

An Random Oracle on Solana based on the Demox Protocol. 
The random numbers are provided by Random.org.

This repository implements the Solana program and provides some utilities to make interacting with it easier.

This repository creates the:
* solrand crate (Rust): https://crates.io/crates/solrand
* solrand package on npm (JS)

# Installation

1. Ensure that Anchor and all of its dependencies are installed: https://project-serum.github.io/anchor/getting-started/introduction.html
1. `yarn install`
1. Rename the `Anchor.example.toml` to `Anchor.toml` and update the `wallet =` to your solana key.
1. Start the `solana-test-validator`
1. Run `anchor build && anchor deploy`
1. Use the Program Id found from the deploy. Replace `GxJJd3q28eUd7kpPCbNXGeixqHmBYJ2owqUYqse3ZrGS` with your new Program Id.
1. Run the tests: `anchor test`

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

# Troubleshooting

## Problems with Anchor
* The most common problem with anchor is using the right version of node. I recommend install Node through NVM and using `Node v16.11.1`. 

# License

We use the `GNU Affero General Public License v3.0 or later` license to ensure the community will always have access to all original and derivations of this program.
Full text here: https://spdx.org/licenses/AGPL-3.0-or-later.html
