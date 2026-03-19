import config from "eslint-config-next"

export default [
  ...config,
  {
    // shadcn/ui Komponenten werden nicht manuell bearbeitet
    ignores: ["src/components/ui/**"],
  },
]
