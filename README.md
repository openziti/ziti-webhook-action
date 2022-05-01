# Ziti Webhook Action

This GitHub workflow action uses [Ziti NodeJS SDK](https://github.com/openziti/ziti-sdk-nodejs) to post an event's `payload` in JSON format over a `Ziti` connection.  

## MacOS Compatibility

If you have a MacOS job you may wish to use `@v1` ref which works with the `macos-latest` hosted runner.

## Usage

```yml
name: ziti-webhook-action
on: [ push ]

jobs:
  ziti-action:
    runs-on: ubuntu-latest
    name: Ziti Webhook Action
    steps:
    - uses: openziti/ziti-webhook-action@v2
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

### Ziti Identity

The `ziti-id` input is the JSON formatted string of an identity enrolled  in a `Ziti` network.

The identity can be created by enrolling via the `ziti edge enroll path/to/jwt [flags]` command.  The `ziti` executable can be obtained [here](https://github.com/openziti/ziti/releases/latest).

### WebHook Secret

This is a random secret string that is used to provide a data integrity hash the receiver may validate. Validation logic that works with [GitHub webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks) also works with `ziti-webhook-action`. From that reference:

```bash
ruby -rsecurerandom -e 'puts SecureRandom.hex(20)'
```

### Extra Data Input

There are two ways to pass arbitrary data to be included in the webhook.

1. Call the Action in a separate workflow with a raw-field. This causes the GitHub context payload to have a top-level dict named `inputs` with a key for each workflow input. This is useful if this Action is always called from another workflow.

```yaml
on:
  workflow_dispatch:  # triggered by a step in the main workflow
    inputs:
      my_release_version:
        description: 'Semantic Version from Builder Bot'
        required: true
```

This example results in a top-level dict in the webhook payload.

```bash
# One way to pass a raw field is to use the GitHub CLI which is pre-installed in all hosted runner VMs
gh workflow --repo myorg/myrepo run --ref $(git rev-parse --abbrev-ref HEAD) --raw-field my_release_version=1.2.3 send-ziti-webhook.yml
```

```yaml
{
  "inputs": {"my_release_version": "1.2.3"}
}
```

2. A multi-line string with key=value pair / line may be passed to the `data` input field of the Action. This is useful if the Action is called in-line as part of a workflow that contains other steps.

```yaml
        with:
          ziti-id: ${{ secrets.ZITI_WEBHOOK_IDENTITY }}
          webhook-url: ${{ secrets.ZITI_WEBHOOK_URL }}
          webhook-secret: ${{ secrets.ZITI_WEBHOOK_SECRET }}
          data: |
            my_release_version=1.2.3
```

Results in:

```yaml
{
  "data": {"my_release_version": "1.2.3"}
}
```
