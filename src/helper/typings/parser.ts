import { StatementInterface } from '../compiler/extra';
import { MethodStatementFunction } from './method'

export * from  './method'

export interface ParserRequestOptions {
  /**
   * 文件注释
   */
  comment: { type: 'single' | 'multi'; comment: string[] | string }[]
  /**
   * http 导入
   */
  httpImport: {
    name: string
    value: string
    imports?: string[]
  }

  typeImport?: {
    name: string
    value: string
  }
  /**
   * 基本地址 const [name] = [value]
   */
  baseURL?: {
    name?: string
    value: string
  }
  /**
   * http config
   */
  typeConfig?: {
    name?: string
    parameter?: string
    type?: string
  }
  /**
   * 方法列表
   */
  functions: Omit<MethodStatementFunction, 'httpImport'>[]
}

export interface ParserTypingsOptions {
  /**
   * 文件注释
   */
  comment: { type: 'single' | 'multi'; comment: string[] | string }[]
  /**
   * 类型列表
   */
  typings: StatementInterface[]

  /**
   * 用于 infer 数据取值
   * export type Response<T> = T
   * 
   * responseType = "T extends { data?: infer V } ? V : T"
   * 
   * export type Response<T> = T extends { data?: infer V } ? V : T
   * 
   * @default T
   */
  responseType?: string
}