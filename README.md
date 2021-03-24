# Ziti Webhook Action

This GitHub workflow action uses [Ziti NodeJS SDK](https://github.com/openziti/ziti-sdk-nodejs) to post an event's `payload` in JSON format over a `Ziti` connection.  

## Usage
```yml
name: ziti-webhook-action
on: [ push ]

jobs:
  ziti-action:
    # Currently only runs on macos
    runs-on: macos-latest
    name: Ziti Webhook Action
    steps:
    - uses: openziti/ziti-webhook-action@main
      with:
        # Identity JSON containing key to access a Ziti network
        ziti-id: ${{ secrets.ZITI_WEBHOOK_ACTION_ID }}

        # URL to post event payload.  Note that the Ziti service
        # name must match the hostname of the URL (e.g.
        # "someapp.ziti")
        webhook-url: 'https://someapp.ziti//plugins/github/webhook'

        # Used to create a hash signature of the payload
        # to be set in the X-Hub-Signature HTTP header
        webhook-secret: ${{ secrets.ZITI_WEBHOOK_SECRET }}
```
## Ziti Identity

The `ziti-id` input is the JSON formatted string of an identity enrolled  in a `Ziti` network.

The identity can be created by enrolling via the `ziti edge enroll path/to/jwt [flags]` command.  The `ziti` executable can be obtained [here](https://github.com/openziti/ziti/releases/latest).
