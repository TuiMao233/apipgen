import type { ApiPipeline, StatementFunction, StatementInterface } from 'apipgen'
import type { Definitions, OpenAPISpecificationV2, Paths, Schema } from 'openapi-specification-types'
import {
  literalFieldsToString,
  parseHeaderCommits,
  parseMethodMetadata,
  parseMethodParameters,
  parseSchemaType,
  traversePaths,
  varName,
} from '@apipgen/swag-parser'

export function parser(configRead: ApiPipeline.ConfigRead) {
  const source = configRead.source as OpenAPISpecificationV2

  const comments = parseHeaderCommits(source)

  const interfaces: StatementInterface[] = []
  const functions: StatementFunction[] = []

  defPuInterfaces(source.definitions, {
    configRead,
    functions,
    interfaces,
  })

  pathsPuFunctions(source.paths, {
    configRead,
    functions,
    interfaces,
  })

  configRead.graphs.comments = comments
  configRead.graphs.functions = functions
  configRead.graphs.interfaces = interfaces

  return configRead
}

interface TransformOptions {
  configRead: ApiPipeline.ConfigRead
  interfaces: StatementInterface[]
  functions: StatementFunction[]
}

function pathsPuFunctions(paths: Paths, { configRead, functions, interfaces }: TransformOptions) {
  traversePaths(paths, (config) => {
    /**
     * function params/function options/function use interfaces
     */
    const { parameters, interfaces: interfaceUses, options } = parseMethodParameters(config, {
      body: 'data',
      query: 'params',
    })
    const { name, description, url, responseType } = parseMethodMetadata(config)

    options.unshift('url')
    options.push(['...', 'config'])
    parameters.push({
      name: 'config',
      type: 'AxiosRequestConfig',
      required: false
    })
    interfaces.push(...interfaceUses)

    const genericType = `Response<${spliceTypeSpace(responseType)}>`

    for (const parameter of parameters || []) {
      if (parameter.type)
        parameter.type = spliceTypeSpace(parameter.type)
    }

    functions.push({
      export: true,
      name,
      description,
      parameters,
      body: [
        url.includes('$') ? `const url = \`${url}\`;` : `const url = "${url}"`,
        `http.request<${genericType}>({ ${literalFieldsToString(options)} })`,
      ],
    })

    function spliceTypeSpace(name: string) {
      const isGenerateType = configRead.config.output?.type !== false
      const isSomeType = interfaces.map(v => v.name).includes(name.replace('[]', ''))
      if (isGenerateType && isSomeType)
        return `Types.${name}`
      return name
    }
  })
}

function defPuInterfaces(definitions: Definitions, { interfaces }: TransformOptions) {
  for (const [name, definition] of Object.entries(definitions)) {
    const { properties = {} } = definition

    interfaces.push({
      export: true,
      name: varName(name),
      properties: Object.keys(properties).map(name => defToFields(name, properties[name])),
    })

    function defToFields(name: string, propertie: Schema) {
      propertie.required = definition?.required?.some(v => v === name)
      if (propertie.description)
        propertie.description = `@description ${propertie.description}`
      return {
        name,
        type: parseSchemaType(propertie),
        description: propertie.description,
        required: propertie.required,
      }
    }
  }
}
