import * as core from '@actions/core'
import { promises as fs } from 'fs'
import {
  createOrUpdateExtension,
  PluginMetaData,
  DownloadUrls
} from './extensionstore'
import { jsonFromSpec } from './luaspec'
import { env } from 'process'

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
      macosarm64: core.getInput('download-url-macos-arm64', {
        required: false
      }),
      macosx64: core.getInput('download-url-macos-x64', { required: false })
    }

    const spec = await fs.readFile(specPath)
    let metaData: PluginMetaData

    if (specPath.endsWith('.json')) {
      const asJson = JSON.parse(spec.toString())
      metaData = asJson as PluginMetaData
    } else if (specPath.endsWith('.lua')) {
      const asJson = JSON.parse(jsonFromSpec(spec.toString()))
      metaData = asJson as PluginMetaData
    } else {
      throw new Error('Spec must be either a .json or .lua file')
    }

    core.debug(`Parsed spec: ${JSON.stringify(metaData)}`)
    await createOrUpdateExtension(downloadUrls, metaData, api, token, publish)

    if (env.GITHUB_STEP_SUMMARY) {
      core.summary
        .addHeading('Extension created or updated')
        .addLink(
          'Check API',
          `${api}/api/v1/plugins/${metaData.VendorId}.${metaData.Id}/versions`
        )
        .write()
    } else {
      core.warning('No $GITHUB_STEP_SUMMARY found')
    }

    if (isTest) {
      // console.log(asJson)
      // The following only works with secret keys etc.
      return
    }

    //core.setOutput('outputJson', asJson)
  } catch (error) {
    core.setFailed(`${error}`)
  }
}
