
declare module 'next' {
  export type GenerateStaticParams<T extends string = string> = () => Promise<
    Array<{ [key in T]: string }>
  >;
}