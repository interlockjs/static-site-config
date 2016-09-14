const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

const { generateEntries, generateRawEntries } = require("./helpers");

const interlockPug = require("interlock-pug");
const interlockStylus = require("interlock-stylus");
const interlockHtml = require("interlock-html");
const interlockCss = require("interlock-css");
const interlockRaw = require("interlock-raw");
const interlockBabili = require("interlock-babili");
const autoprefixerPlugin = require("autoprefixer");


const cwd = process.cwd();


const getRawExclusions = ({ pug, stylus }) => {
  const excludeFromRaw = ["js", "html", "css"];
  if (pug) { excludeFromRaw.push(pug); }
  if (stylus) { excludeFromRaw.push(stylus); }

  return excludeFromRaw;
};

const getPlugins = ({ pug, stylus, minify, autoprefixer, excludeFromRaw }) => [
  pug ? interlockPug({
    filter: new RegExp(`\\.${pug}`),
    getLocals: module => {
      try {
        const dataPath = path.resolve(module.path, "../_locals.yaml");
        return yaml.safeLoad(fs.readFileSync(dataPath, "utf8"));
      } catch (err) {
        return {};
      }
    }
  }) : null,

  stylus ? interlockStylus({
    filter: new RegExp(`\\.${stylus}`)
  }) : null,

  interlockHtml(),

  interlockCss({
    mode: "bundle",
    plugins: autoprefixer ? [ autoprefixerPlugin ] : []
  }),

  interlockRaw({ exclude: excludeFromRaw }),

  minify ? interlockBabili() : null
].filter(x => x);

export default (opts = {}) => {
  const srcRoot = opts.srcRoot || path.join(cwd, "src");
  const pug = opts.pug || false;
  const stylus = opts.stylus || false;
  const autoprefixer = opts.autoprefixer || false;
  const minify = opts.minify || false;
  const excludeFromRaw = getRawExclusions({ pug, stylus });

  const entry = Object.assign(
    {},
    generateEntries(srcRoot, "js", null),
    generateEntries(srcRoot, "html", null),
    pug ? generateEntries(srcRoot, pug, "html") : {},
    stylus ? generateEntries(srcRoot, stylus, "css") : {},
    generateEntries(srcRoot, "css", null),
    generateRawEntries(srcRoot, excludeFromRaw)
  );

  const plugins = getPlugins({ pug, stylus, minify, autoprefixer, excludeFromRaw });

  return { entry, plugins };
};
