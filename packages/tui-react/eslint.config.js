import { base, bun, files, jsx, react } from "@kx/config-eslint"

export default [...base(), ...bun(), ...jsx(), ...react(), ...files()]
