import * as core from '@actions/core'
import {IssueLabeler} from './IssueLabeler'

async function run(): Promise<void> {
  try {
    core.debug('Started')
    const token = core.getInput('token', {required: true})
    const labeler = new IssueLabeler(token)
    await labeler.labelCurrentContextIssue()
    core.debug('Finished')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
