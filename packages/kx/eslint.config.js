import { base, bun, files, jsx } from "@kx/config-eslint"

export default [...base(), ...bun(), ...jsx(), ...files()]
