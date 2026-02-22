import * as core from '@actions/core'
import * as github from '@actions/github'
import {IssueLabeler} from '../src/IssueLabeler'
import {IssuesOpenedEvent} from '@octokit/webhooks-types'

jest.mock('@actions/core')
jest.mock('@actions/github')

const mockAddLabels = jest.fn()
const mockGetCommit = jest.fn()

const mockOctokit = {
  rest: {
    issues: {addLabels: mockAddLabels},
    repos: {getCommit: mockGetCommit}
  }
}

;(github.getOctokit as jest.Mock).mockReturnValue(mockOctokit)
;((github.context as unknown) as {repo: {owner: string; repo: string}}).repo = {
  owner: 'test-owner',
  repo: 'test-repo'
}

function makeIssue(
  body: string | null,
  labels: {name: string}[] = []
): IssuesOpenedEvent['issue'] {
  return ({
    number: 1,
    body,
    labels,
    state: 'open',
    closed_at: null
  } as unknown) as IssuesOpenedEvent['issue']
}

describe('IssueLabeler', () => {
  let labeler: IssueLabeler

  beforeEach(() => {
    jest.clearAllMocks()
    labeler = new IssueLabeler('fake-token')
  })

  test('applies Invalid label when body has no commit hash', async () => {
    const issue = makeIssue('This is a bug with no hash.')
    await labeler.setMissingHashLabel(issue)
    expect(mockGetCommit).not.toHaveBeenCalled()
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      labels: ['Invalid-MissingHash/Commit/NotAC']
    })
  })

  test('does not apply Invalid label when body contains a valid commit hash', async () => {
    mockGetCommit.mockResolvedValueOnce({})
    const issue = makeIssue(
      'Fixed by commit e17338f405d03fd460322fb5463e9166f508b696'
    )
    await labeler.setMissingHashLabel(issue)
    expect(mockAddLabels).not.toHaveBeenCalled()
  })

  test('applies Invalid label when body has a hash-like string that is not a valid commit', async () => {
    mockGetCommit.mockRejectedValueOnce(new Error('Not found'))
    const issue = makeIssue('Looks like abc1234 but not valid.')
    await labeler.setMissingHashLabel(issue)
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      labels: ['Invalid-MissingHash/Commit/NotAC']
    })
  })

  test('does not apply Invalid label when issue has Feature label', async () => {
    const issue = makeIssue('Please add this new feature.', [{name: 'Feature'}])
    await labeler.setMissingHashLabel(issue)
    expect(mockGetCommit).not.toHaveBeenCalled()
    expect(mockAddLabels).not.toHaveBeenCalled()
  })

  test('applies Invalid label when issue has a different label but no Feature label', async () => {
    const issue = makeIssue('Something broke.', [{name: 'Bug'}])
    await labeler.setMissingHashLabel(issue)
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      labels: ['Invalid-MissingHash/Commit/NotAC']
    })
  })

  test('does not apply Invalid label when body is null and issue has Feature label', async () => {
    const issue = makeIssue(null, [{name: 'Feature'}])
    await labeler.setMissingHashLabel(issue)
    expect(mockGetCommit).not.toHaveBeenCalled()
    expect(mockAddLabels).not.toHaveBeenCalled()
  })

  test('applies Invalid label when body is null and no Feature label', async () => {
    const issue = makeIssue(null)
    await labeler.setMissingHashLabel(issue)
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      labels: ['Invalid-MissingHash/Commit/NotAC']
    })
  })

  test('LabelCurrentContextIssue throws on non-issues event', async () => {
    ;((github.context as unknown) as {eventName: string}).eventName =
      'pull_request'
    await expect(labeler.labelCurrentContextIssue()).rejects.toThrow(
      "Event 'pull_request' is not supported"
    )
  })

  test('LabelCurrentContextIssue handles opened action', async () => {
    ;((github.context as unknown) as {eventName: string}).eventName = 'issues'
    ;((github.context as unknown) as {
      payload: Partial<IssuesOpenedEvent>
    }).payload = {
      action: 'opened',
      issue: makeIssue('no hash here')
    }
    await labeler.labelCurrentContextIssue()
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      issue_number: 1,
      labels: ['Invalid-MissingHash/Commit/NotAC']
    })
  })
})

// Keep the original placeholder so jest doesn't fail with no tests
test('to do', async () => {})
