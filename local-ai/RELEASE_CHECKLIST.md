# Release Checklist

## Code

- [ ] `npm run build` passes
- [ ] `cargo check` passes
- [ ] Chat works against a live Ollama instance
- [ ] Memory files load and influence responses
- [ ] Settings persist across restart
- [ ] Onboarding works on a fresh profile

## Assets

- [ ] App icon finalized for all platforms
- [ ] README is current
- [ ] CHANGELOG updated for the release
- [ ] Product metadata reviewed in `src-tauri/tauri.conf.json`

## Packaging

- [ ] `npm run tauri:build` succeeds on Windows
- [ ] Installer launches correctly on Windows
- [ ] macOS build verified on macOS
- [ ] Linux build verified on Linux

## Distribution

- [ ] Version number reviewed in `package.json`, `Cargo.toml`, and `tauri.conf.json`
- [ ] GitHub release notes prepared
- [ ] Release artifacts tested after download
