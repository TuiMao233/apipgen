import { compiler, dest, generate, original } from '@apipgen/pipeline'
import type { ApiPipeline } from 'apipgen'
import { pipeline } from 'apipgen'
import { readConfig } from './config'
import { parser } from './parser'

function OpenAPI2Typescript(config: ApiPipeline.Config) {
  const process = pipeline(
    config => readConfig(config),
    configRead => original(configRead),
    configRead => parser(configRead),
    configRead => compiler(configRead),
    configRead => generate(configRead),
    configRead => dest(configRead),
  )
  return process(config)
}
export { readConfig, original, parser, compiler, generate, dest }

export default OpenAPI2Typescript
