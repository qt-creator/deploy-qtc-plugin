import * as core from '@actions/core'
import { promises as fs } from 'fs'
import {
  createOrUpdateExtension,
  PluginMetaData,
  DownloadUrls
} from './extensionstore'

// Import fs

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const specPath: string = core.getInput('spec')
    const isTest: boolean =
      core.getInput('test', { required: false }) === 'true'
    const api: string = core.getInput('api')
    const token: string = core.getInput('token')
    const publish: boolean =
      core.getInput('publish', { required: false }) === 'true'

    const downloadUrls: DownloadUrls = {
      winx64: core.getInput('download-url-win-x64', { required: false }),
      winarm64: core.getInput('download-url-win-arm64', { required: false }),
      linuxx64: core.getInput('download-url-linux-x64', { required: false }),
      linuxarm64: core.getInput('download-url-linux-arm64', {
        required: false
      }),
      macos: core.getInput('download-url-macos', { required: false })
    }

    const spec = await fs.readFile(specPath)
    const asJson = JSON.parse(spec.toString())

    core.debug(`Parsed spec: ${JSON.stringify(asJson)}`)

    if (isTest) {
      // console.log(asJson)
      // The following only works with secret keys etc.
      return
    }

    await createOrUpdateExtension(
      downloadUrls,
      asJson as unknown as PluginMetaData,
      api,
      token,
      publish
    )

    //core.setOutput('outputJson', asJson)
  } catch (error) {
    core.setFailed(`${error}`)
  }
}
