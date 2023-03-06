# Compatibility tables

This directory contains compatibility tables for various adblock rule features.

## Supported categories

Currently, the following categories are supported. Each category has its own compatibility table:

- Modifiers
- Scriptlets
- Redirects
- (Extended) CSS selectors

Please note that certain things, such as syntax or rule categories, cannot be handled by the compatibility table. This is simply because they rarely change, and would also require a high level of abstraction, so it is much easier to manage them at a low level, at the parser / converter level. The compatibility table mainly covers features that are well abstracted and common to several adblockers, just with different implementations. For example, network rule modifiers or CSS selectors are used by all adblockers, but with different functionality.

## Supported adblockers and platforms

Currently we support the following adblockers:

- AdGuard (`adg`)
- uBlock Origin (`ubo`)
- AdBlock / Adblock Plus (`abp`)

However, there may also be compatibility differences within a brand due to the specificities and limitations of each platform. For example:

- AdGuard content blockers doesn't support CSS injection, while the AdGuard browser extension does. This is because the API of a content blocker does not allow this, while a modern browser extension allows stylesheet injection.
- AdGuard Chrome extension doesn't support HTML filtering, while the Firefox extension does. This is simply because Chrome's API does not provide this level of network-level filtering, while Firefox's does.
- etc.

Therefore, we need to specify the platform for each adblocker to cover all the edge cases. The following platforms are supported:

- AdGuard:
  - OS-wide apps:
    - `adg_os_windows`
    - `adg_os_mac`
    - `adg_os_android`
  - Browser extensions:
    - `adg_ext_chromium`
    - `adg_ext_firefox`
    - `adg_ext_opera`
    - `adg_ext_edge`
  - Content blockers:
    - `adg_cb_android`
    - `adg_cb_ios`
    - `adg_cb_safari`
- uBlock Origin:
  - Browser extensions:
    - `ubo_ext_chrome`
    - `ubo_ext_firefox`
    - `ubo_ext_opera`
    - `ubo_ext_edge`
- Adblock Plus:
  - Browser extensions:
    - `abp_ext_chrome`
    - `abp_ext_firefox`
    - `abp_ext_opera`
    - `abp_ext_edge`

For simplicity, the following shortcuts are also supported:

- `any`: any adblocker
- `adg_any`: any AdGuard adblocker
- `adg_ext_any`: any AdGuard browser extension
- `adg_ext_chromium`: AdGuard browser extension for Chromium-based browsers\*
- `adg_cb_any`: any AdGuard content blocker
- `ubo_ext_any`: any uBlock Origin browser extension
- `ubo_ext_chromium`: uBlock Origin browser extension for Chromium-based browsers\*
- `abp_ext_any`: any Adblock Plus browser extension
- `abp_ext_chromium`: Adblock Plus browser extension for Chromium-based browsers\*

\* Chromium-based browsers include Google Chrome, Microsoft Edge, Opera, Brave, Vivaldi, etc. See more details [here](https://en.wikipedia.org/wiki/Chromium_(web_browser)).
