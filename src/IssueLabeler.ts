import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssuesOpenedEvent} from '@octokit/webhooks-types'

type GitHub = ReturnType<typeof github.getOctokit>

export class IssueLabeler {
  private octokit: GitHub

  constructor(token: string) {
    this.octokit = github.getOctokit(token)
  }

  async labelCurrentContextIssue(): Promise<void> {
    const context = github.context
    if (context.eventName !== 'issues')
      throw new Error(`Event '${context.eventName}' is not supported`)

    const payload = context.payload as IssuesOpenedEvent
    core.debug(`payload action: ${payload.action}`)

    switch (payload.action) {
      case 'opened':
        await this.setMissingHashLabel(payload.issue)
        break
      default:
        throw new Error(`Unhandled issue action ${payload.action}`)
    }
  }

  async setMissingHashLabel(issue: IssuesOpenedEvent['issue']): Promise<void> {
    core.debug('SetMissingHashLabel start')

    const hasFeatureLabel = (issue.labels ?? []).some(
      label => label.name === 'Feature'
    )
    if (hasFeatureLabel) {
      core.debug(
        'Issue has Feature label, skipping Invalid-MissingHash/Commit/NotAC'
      )
      return
    }

    const body = issue.body ?? ''
    const regex = new RegExp('\\b[a-f0-9]{7,40}\\b', 'gi')
    let matches = regex.exec(body)
    let found = false

    const {owner, repo} = github.context.repo

    while (matches !== null) {
      const element = matches[0]
      core.debug(`Checking '${element}' as valid commit SHA`)
      matches = regex.exec(body)
      try {
        await this.octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: element
        })
        core.debug(`Found valid commit SHA '${element}'`)
        found = true
        break
      } catch (error) {
        core.debug(`'${element}' is not a valid SHA commit`)
        core.debug(String(error))
      }
    }

    if (!found) await this.setLabel(issue, 'Invalid-MissingHash/Commit/NotAC')

    core.debug('SetMissingHashLabel end')
  }

  async setLabel(
    issue: IssuesOpenedEvent['issue'],
    label: string
  ): Promise<void> {
    const {owner, repo} = github.context.repo
    await this.octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issue.number,
      labels: [label]
    })
  }
}
