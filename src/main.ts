import * as core from '@actions/core'
import {WorkflowPullRequestLabeler} from './WorkflowPullRequestLabeler'

async function run(): Promise<void> {
  try {
    core.debug('Started')

    const token = core.getInput('token', {required: true})
    const labeler = new WorkflowPullRequestLabeler(token)
    await labeler.LabelPullRequests()

    core.debug('Finished')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
