import { StatementFiled, LiteralFiled } from '../compiler/extra'

export interface MethodStatementFunction {
  /**
   * 方法名称
   */
  name: string
  /**
   * 调用库|名称
   */
  lib: string
  /**
   * 形参列表
   */
  parameters: StatementFiled[]
  /**
   * 配置列表
   */
  options: LiteralFiled[]
  /**
   * 函数调用 URL
   */
  url: string
  /**
   * 响应内容
   */
  responseType: string
  /**
   * comment
   */
  comment?: string[] | string
  /**
   * 请求方法
   */
  method: string

  /**
   * 元信息
   */
  meta?: any
}