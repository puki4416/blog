// custom typefaces
import "@fontsource/montserrat/variable.css"
import "@fontsource/merriweather"
// normalize CSS across browsers
import "./src/normalize.css"
// custom CSS styles
import "./src/style.css"

// Highlighting for code blocks
import "prismjs/themes/prism-solarizedlight.css"
import "prismjs/plugins/line-numbers/prism-line-numbers.css"

import React from "react"
import RootElement from "./src/context/root-element"

export const wrapRootElement = ({ element }) => {
  return <RootElement>{element}</RootElement>
}
