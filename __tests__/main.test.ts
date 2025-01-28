/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

//import * as core from '@actions/core'
import * as main from '../src/main'
import fetchMock from 'jest-fetch-mock'
import * as core from '@actions/core'
import path from 'path'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
//let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

fetchMock.enableMocks()

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetchMock.resetMocks()

    debugMock = jest.spyOn(core, 'debug').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    //setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
  })

  it('should run', async () => {
    await main.run()
    expect(runMock).toHaveReturned()
    expect(setFailedMock).toHaveBeenCalled()
  })

  it('should upload a plugin', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'false'
        case 'spec':
          return path.join(__dirname, 'data', 'PhantomStyle.json')
        case 'api':
          return 'https://example.com/'
        case 'token':
          return '__token__'
        case 'publish':
          return 'true'
        case 'download-url-linux-arm':
          return 'https://github.com/cristianadam/phantomstyle/releases/download/v15.0.1/PhantomStyle-15.0.1-Linux-arm64.7z'
        case 'download-url-linux-x64':
          return 'https://github.com/cristianadam/phantomstyle/releases/download/v15.0.1/PhantomStyle-15.0.1-Linux-x64.7z'
        case 'download-url-macos':
          return 'https://github.com/cristianadam/phantomstyle/releases/download/v15.0.1/PhantomStyle-15.0.1-macOS-universal.7z'
        case 'download-url-win-arm':
          return 'https://github.com/cristianadam/phantomstyle/releases/download/v15.0.1/PhantomStyle-15.0.1-Windows-arm64.7z'
        case 'download-url-win-x64':
          return 'https://github.com/cristianadam/phantomstyle/releases/download/v15.0.1/PhantomStyle-15.0.1-Windows-x64.7z'
        default:
          return ''
      }
    })

    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Something went wrong' }),
      {
        status: 400,
        statusText: 'Bad Request'
      }
    )

    await main.run()
    expect(runMock).toHaveReturned()
    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'Error: HTTP Error: 400, Bad Request, {"message":"Something went wrong"}'
      )
    )

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com/api/v1/management/plugins',
      expect.objectContaining({
        body: expect.anything(),
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer __token__',
          'Content-Type': 'application/json',
          accept: 'application/json'
        })
      })
    )
  })
  it('can read lua spec', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'true'
        case 'spec':
          return path.join(__dirname, 'data', 'testspec.lua')
        case 'api':
          return 'https://example.com/'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).not.toHaveBeenCalled()
  })
  it('fails if it tries to exit', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'true'
        case 'spec':
          return path.join(__dirname, 'data', 'exit.lua')
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Error: osExit not allowed')
    )
  })
  it('fails if it tries to load a file', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'true'
        case 'spec':
          return path.join(__dirname, 'data', 'loadfile.lua')
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Error: loadFile not allowed')
    )
  })
  it('can print to debug', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'true'
        case 'spec':
          return path.join(__dirname, 'data', 'print.lua')
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()
    expect(debugMock).toHaveBeenNthCalledWith(1, 'Hello World!')

    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).not.toHaveBeenCalled()
  })
  it('spec must be a table', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'true'
        case 'spec':
          return path.join(__dirname, 'data', 'notable.lua')
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Error: Spec must be a table')
    )
  })
  it('spec can contain utf-8 characters', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'true'
        case 'spec':
          return path.join(__dirname, 'data', 'utf8spec.lua')
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(errorMock).not.toHaveBeenCalled()
    expect(setFailedMock).not.toHaveBeenCalled()
  })
  it('should fail if invalid response', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'false'
        case 'spec':
          return path.join(__dirname, 'data', 'testspec.lua')
        case 'download-url':
          return 'https://example.com/test.zip'
        case 'api':
          return 'https://example.com/'
        case 'token':
          return 'token'
        default:
          return ''
      }
    })

    fetchMock.mockResponseOnce(
      JSON.stringify({ message: 'Something went wrong' }),
      {
        status: 400,
        statusText: 'Bad Request'
      }
    )
    await main.run()
    expect(setFailedMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'HTTP Error: 400, Bad Request, {"message":"Something went wrong"}'
      )
    )
  })
  it('should handle a 500 error', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'false'
        case 'spec':
          return path.join(__dirname, 'data', 'testspec.lua')
        case 'download-url':
          return 'https://example.com/test.zip'
        case 'api':
          return 'https://example.com/'
        case 'token':
          return 'token'
        default:
          return ''
      }
    })

    fetchMock.mockResponseOnce('', {
      status: 500,
      statusText: 'Internal Server Error'
    })
    await main.run()
    expect(setFailedMock).toHaveBeenCalledWith(
      expect.stringContaining('HTTP Error: 500, Internal Server Error')
    )
  })
  it('Should create a new plugin if not found', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'test':
          return 'false'
        case 'spec':
          return path.join(__dirname, 'data', 'testspec.lua')
        case 'download-url':
          return 'https://example.com/test.zip'
        case 'api':
          return 'https://example.com/'
        case 'token':
          return '__token__'
        default:
          return ''
      }
    })

    fetchMock.mockResponseOnce(JSON.stringify({ items: [] }), { status: 200 })
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 200 })
    await main.run()
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com/api/v1/management/plugins',
      expect.objectContaining({
        body: expect.anything(),
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer __token__',
          'Content-Type': 'application/json',
          accept: 'application/json'
        })
      })
    )
    expect(setFailedMock).not.toHaveBeenCalled()
  })
})
