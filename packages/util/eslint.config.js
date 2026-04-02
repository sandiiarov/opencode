import { base, files, node } from "@kx/config-eslint"

export default [...base(), ...node(), ...files()]
