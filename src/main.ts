import * as core from '@actions/core'
import {DBPullRequestLabeler} from './DBPullRequestLabeler'

async function run(): Promise<void> {
  try {
    core.debug('Started')

    const token = core.getInput('token', {required: true})
    const labeler = new DBPullRequestLabeler(token)
    await labeler.LabelPullRequests()

    core.debug('Finished')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
