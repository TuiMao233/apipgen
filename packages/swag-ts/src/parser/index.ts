import camelCase from 'lodash/camelCase'
import type { ApiPipeline, StatementFunction, StatementInterface, StatementTypeAlias } from 'apipgen'
import type { OpenAPISpecificationV2, Schema } from 'openapi-specification-types'
import { getFunctionOptions, getPropertieType, traversePaths } from './utils'
import { varName } from './utils/format'
import { literalFieldsToString } from './utils/other'

export function parser(configRead: ApiPipeline.ConfigRead) {
  const source = configRead.source as OpenAPISpecificationV2

  const comments = [
    `@title ${source.info.title}`,
    `@description ${source.info.description}`,
    source.swagger && `@swagger ${source.swagger}`,
    `@version ${source.info.version}`,
  ]
  const typings: StatementTypeAlias[] = [
    { export: true, name: 'Response<T>', value: 'T' },
  ]
  const interfaces: StatementInterface[] = []
  const functions: StatementFunction[] = []

  function transformPaths() {
    traversePaths(source.paths, (config) => {
      const { method, path, options: meta } = config
      /**
       * function params/function options/function use interfaces
       */
      const { parameters, interfaces: interfaceUses, options } = getFunctionOptions(config)

      interfaces.push(...interfaceUses)

      /**
       * function comments
       */
      const comments = [
        meta.summary && `@summary ${meta.summary}`,
        meta.description && `@description ${meta.description}`,
        `@method ${method}`,
        meta.tags && `@tags ${meta.tags.join(' | ') || '-'}`,
        meta.consumes && `@consumes ${meta.consumes.join('; ') || '-'}`,
      ]
      /**
       * function name
       */
      const name = camelCase(`${method}/${path}`)
      const url = `${path.replace(/({)/g, '${paths?.')}`

      /**
       * response type
       */
      const responseType = meta.responses['200'] ? getPropertieType(meta.responses['200']) : 'void'
      const prefixType = configRead.config.output?.type === false ? '' : 'OpenAPITypes.'
      const genericType = `${prefixType}Response<${spliceTypeSpace(responseType)}>`

      functions.push({
        export: true,
        name,
        description: comments.filter(Boolean),
        parameters,
        body: [
          url.includes('$') ? `const url = \`${url}\`;` : `const url = "${url}"`,
          `http.request<${genericType}>>({ ${literalFieldsToString(options)} })`,
        ],
      })
    })
  }

  function transformDefinitions() {
    for (const [name, definition] of Object.entries(source.definitions)) {
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
          type: getPropertieType(propertie),
          description: propertie.description,
          required: propertie.required,
        }
      }
    }
  }

  function transformNameSpace() {
    for (const iterator of functions) {
      for (const parameter of iterator.parameters || []) {
        if (parameter.type)
          parameter.type = spliceTypeSpace(parameter.type)
      }
    }
  }

  function spliceTypeSpace(name: string) {
    const isRenderType = configRead.config.output?.type !== false
    const isSomeType = interfaces.map(v => v.name).includes(name.replace('[]', ''))
    if (isRenderType && isSomeType)
      return `OpenAPITypes.${name}`
    return name
  }

  transformPaths()
  transformDefinitions()
  transformNameSpace()

  configRead.graphs.comments = comments
  configRead.graphs.functions = functions
  configRead.graphs.typings = typings
  configRead.graphs.interfaces = interfaces

  return configRead
}