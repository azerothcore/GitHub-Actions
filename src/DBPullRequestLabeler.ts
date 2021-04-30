import * as core from '@actions/core'
import * as github from '@actions/github'
import {Webhooks} from '@octokit/webhooks'

export class DBPullRequestLabeler {
  private octokit: github.GitHub
  constructor(token: string) {
    this.octokit = new github.GitHub(token)
  }

  async LabelPullRequests(): Promise<void> {
    const context = github.context

    if (context.eventName !== 'pull_request_target')
      throw new Error(`Event '${context.eventName}' is not supported`)

    const rawPayload = context.payload
    core.debug(`rawPayload: ${JSON.stringify(rawPayload)}`)

    const payload = rawPayload as Webhooks.WebhookPayloadPullRequest

    // disabled for forks
    if (payload.repository.fork) {
      return
    }

    switch (payload.action) {
      case 'opened':
        await this.SetDBLabel(payload.pull_request)
        break
      default:
        throw new Error(`Unhandled pr action ${payload.action}`)
    }
  }

  private async SetDBLabel(
    pr: Webhooks.WebhookPayloadPullRequestPullRequest
  ): Promise<void> {
    core.debug('SetDBLabel start')

    await this.SetLabel(pr, 'DB')
    }

    core.debug('SetDBLabel end')
  }

  private async SetLabel(
    pr: Webhooks.WebhookPayloadPullRequestPullRequest,
    label: string
  ): Promise<void> {
    await this.octokit.request(`POST ${pr.issue_url}/labels`, {
      labels: [label]
    })
  }
}