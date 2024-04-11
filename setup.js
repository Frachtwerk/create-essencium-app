#! /usr/bin/env node

/*
 * Copyright (C) 2024 Frachtwerk GmbH, Leopoldstraße 7C, 76133 Karlsruhe.
 *
 * This file is part of Essencium Frontend.
 *
 * Essencium Frontend is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Essencium Frontend is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Essencium Frontend. If not, see <http://www.gnu.org/licenses/>.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const NEW_APP_LOCATION = process.argv?.[2]

if (!NEW_APP_LOCATION) {
  throw new Error('Please provide a location!')
}

const REPO_URL = 'git@github.com:Frachtwerk/essencium-frontend.git'
const TEMP_DIR_CLONED_REPO_NAME = 'temp_cloned_repo'

execSync(`git clone ${REPO_URL} ${TEMP_DIR_CLONED_REPO_NAME}`, { stdio: 'inherit' })

const appPackageJsonPath = path.join(
  __dirname,
  `./${TEMP_DIR_CLONED_REPO_NAME}/packages/app/package.json`,
)

const libPackageJsonPath = path.join(
  __dirname,
  TEMP_DIR_CLONED_REPO_NAME,
  'packages',
  'lib',
  'package.json',
)
const typesPackageJsonPath = path.join(
  __dirname,
  TEMP_DIR_CLONED_REPO_NAME,
  'packages',
  'types',
  'package.json',
)
const eslintConfigPackageJsonPath = path.join(
  __dirname,
  TEMP_DIR_CLONED_REPO_NAME,
  'packages',
  'eslint-config',
  'package.json',
)
const prettierConfigPackageJsonPath = path.join(
  __dirname,
  TEMP_DIR_CLONED_REPO_NAME,
  'packages',
  'prettier-config',
  'package.json',
)

const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf-8'))
const libPackageJson = JSON.parse(fs.readFileSync(libPackageJsonPath, 'utf-8'))
const typesPackageJson = JSON.parse(
  fs.readFileSync(typesPackageJsonPath, 'utf-8'),
)
const eslintConfigPackageJson = JSON.parse(
  fs.readFileSync(eslintConfigPackageJsonPath, 'utf-8'),
)
const prettierConfigPackageJson = JSON.parse(
  fs.readFileSync(prettierConfigPackageJsonPath, 'utf-8'),
)

function replaceWorkspaceWithVersion() {
  // Loop through dependencies of app package
  Object.entries(appPackageJson.dependencies).forEach(([dep, version]) => {
    // If the dependency version is 'workspace:*', replace it with the actual version from lib or types package
    if (version === 'workspace:*') {
      if (dep === '@frachtwerk/essencium-lib') {
        appPackageJson.dependencies[dep] = libPackageJson.version
      } else if (dep === '@frachtwerk/essencium-types') {
        appPackageJson.dependencies[dep] = typesPackageJson.version
      }
    }
  })

  // Loop through devDependencies of app package
  Object.entries(appPackageJson.devDependencies).forEach(([dep, version]) => {
    // If the dependency version is 'workspace:*', replace it with the actual version from lib or types package
    if (version === 'workspace:*') {
      if (dep === '@frachtwerk/eslint-config-essencium') {
        appPackageJson.devDependencies[dep] = eslintConfigPackageJson.version
      } else if (dep === '@frachtwerk/prettier-config-essencium') {
        appPackageJson.devDependencies[dep] = prettierConfigPackageJson.version
      }
    }
  })

  // Write changes back to app package.json
  fs.writeFileSync(appPackageJsonPath, JSON.stringify(appPackageJson, null, 2))
}

function moveAppFolderIntoNewDir() {
  fs.renameSync(
    path.join(__dirname, TEMP_DIR_CLONED_REPO_NAME, 'packages', 'app'),
    path.join(__dirname, NEW_APP_LOCATION),
  )
}

function removeTsConfigsInNewAppDir() {
  fs.unlinkSync(path.join(__dirname, NEW_APP_LOCATION, 'tsconfig.json'))
  fs.unlinkSync(path.join(__dirname, NEW_APP_LOCATION, 'tsconfig.build.json'))
  fs.unlinkSync(path.join(__dirname, NEW_APP_LOCATION, 'tsconfig.base.json'))
}

function removeVitestConfigInNewAppDir() {
  fs.unlinkSync(path.join(__dirname, NEW_APP_LOCATION, 'vitest.config.ts'))
}

function copyAppTsConfigFileIntoNewAppDir() {
  fs.copyFileSync(
    path.join(__dirname, NEW_APP_LOCATION, 'misc', 'tsconfig.app.json'),
    path.join(__dirname, NEW_APP_LOCATION, 'tsconfig.json'),
  )
}

function copyAppVitestConfigFileIntoNewAppDir() {
  fs.copyFileSync(
    path.join(__dirname, NEW_APP_LOCATION, 'misc', 'vitest.config.app.ts'),
    path.join(__dirname, NEW_APP_LOCATION, 'vitest.config.ts'),
  )
}

function removeMiscFolderInNewAppDir() {
  fs.rmdirSync(path.join(__dirname, NEW_APP_LOCATION, 'misc'), {
    recursive: true,
  })
}

function removeClonedFolder() {
  fs.rmdirSync(path.join(__dirname, TEMP_DIR_CLONED_REPO_NAME), {
    recursive: true,
  })
}

function configureNewApp() {
  const newAppPackageJsonPath = path.join(
    __dirname,
    `./${NEW_APP_LOCATION}/package.json`,
  )

  const newAppPackageJson = JSON.parse(
    fs.readFileSync(newAppPackageJsonPath, 'utf-8'),
  )

  newAppPackageJson.name = NEW_APP_LOCATION
  newAppPackageJson.version = '1.0.0'
  newAppPackageJson.description = 'A new Essencium-based app.'
  delete newAppPackageJson.nx

  fs.writeFileSync(
    newAppPackageJsonPath,
    JSON.stringify(newAppPackageJson, null, 2),
  )
}

function cleanUpSomeFilesInNewApp() {
  fs.unlinkSync(path.join(__dirname, NEW_APP_LOCATION, 'CHANGELOG.md'))
  fs.unlinkSync(path.join(__dirname, NEW_APP_LOCATION, 'README.md'))
}

replaceWorkspaceWithVersion()

moveAppFolderIntoNewDir()

removeTsConfigsInNewAppDir()

removeVitestConfigInNewAppDir()

copyAppTsConfigFileIntoNewAppDir()

copyAppVitestConfigFileIntoNewAppDir()

removeMiscFolderInNewAppDir()

removeClonedFolder()

configureNewApp()

cleanUpSomeFilesInNewApp()
