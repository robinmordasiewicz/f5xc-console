---
# ============================================================================
# PLUGIN DOCUMENTATION TEMPLATE
# ============================================================================
# This template provides a standardized format for plugin documentation.
# Variables in {{ brackets }} are auto-populated from plugin.json metadata.
#
# MkDocs Material Compatible Features:
# - Admonitions (note, tip, warning, danger)
# - Content tabs
# - Collapsible sections
# - Tables with sorting
# - Badge shields
# - Icons and emojis
# ============================================================================
---

<div align="center">

# {{ plugin.name }}

[![Version](https://img.shields.io/badge/version-{{ plugin.version }}-blue?style=for-the-badge)](https://github.com/{{ plugin.repo }}/releases)
[![License](https://img.shields.io/badge/license-{{ plugin.license }}-green?style=for-the-badge)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-purple?style=for-the-badge)](https://claude.com/claude-code)

**{{ plugin.description }}**

[Installation](#installation) | [Commands](#commands) | [Skills](#skills) | [Examples](#examples) | [Troubleshooting](#troubleshooting)

</div>

---

## Overview

<!--
Brief 2-3 sentence overview of what the plugin does and its primary use case.
Focus on the value it provides to users.
-->

{{ plugin.description }}

!!! tip "Quick Start"
    ```bash
    /plugin install {{ plugin.name }}
    /{{ plugin.command_prefix }}:{{ plugin.primary_command }} --help
    ```

## Features

<!-- List key features with icons for visual appeal -->

| Feature | Description | Status |
|:--------|:------------|:------:|
| :material-check-circle: **Feature 1** | Description of feature | :white_check_mark: |
| :material-check-circle: **Feature 2** | Description of feature | :white_check_mark: |
| :material-clock-outline: **Feature 3** | Description of planned feature | :construction: |

## Prerequisites

!!! warning "Requirements"
    Before using this plugin, ensure you have:

- [ ] **Claude Code** - [Install Claude Code](https://claude.com/claude-code)
- [ ] **Required Extension** - Any browser extensions or tools needed
- [ ] **API Access** - Required credentials or API tokens

### Environment Variables

```bash
# Required
export REQUIRED_VAR="your-value-here"

# Optional
export OPTIONAL_VAR="default-value"
```

## Installation

=== "From Marketplace"

    ```bash
    # Add the marketplace (one time)
    /plugin marketplace add {{ plugin.marketplace }}

    # Install the plugin
    /plugin install {{ plugin.name }}
    ```

=== "Direct Install"

    ```bash
    /plugin install {{ plugin.repo }}
    ```

=== "Local Development"

    ```bash
    git clone https://github.com/{{ plugin.repo }}.git
    cd {{ plugin.name }}
    /plugin install .
    ```

## Commands

### `/{{ plugin.command_prefix }}:{{ plugin.primary_command }}`

**Description:** Primary command description

!!! example "Usage"
    ```bash
    /{{ plugin.command_prefix }}:{{ plugin.primary_command }} <action> [arguments]
    ```

#### Actions

| Action | Description | Example |
|:-------|:------------|:--------|
| `action1` | What action1 does | `/{{ plugin.command_prefix }}:{{ plugin.primary_command }} action1 arg` |
| `action2` | What action2 does | `/{{ plugin.command_prefix }}:{{ plugin.primary_command }} action2 arg` |

#### Arguments

| Argument | Required | Type | Description | Default |
|:---------|:--------:|:-----|:------------|:--------|
| `--arg1` | :white_check_mark: | `string` | Description | - |
| `--arg2` | :x: | `boolean` | Description | `false` |
| `--arg3` | :x: | `number` | Description | `10` |

## Skills

### `{{ plugin.skill_name }}`

> {{ plugin.skill_description }}

??? info "Skill Metadata"
    | Field | Value |
    |:------|:------|
    | **Triggers** | keyword1, keyword2, keyword3 |
    | **MCP Tools** | `tool1`, `tool2`, `tool3` |
    | **Version** | {{ plugin.version }} |

#### Capabilities

- :material-check: Capability 1
- :material-check: Capability 2
- :material-check: Capability 3

#### Bundled Resources

```
skills/{{ plugin.skill_name }}/
├── SKILL.md              # Main skill instructions
├── metadata.json         # Navigation metadata
├── url-sitemap.json      # URL mapping (NEW in v2.2+)
├── scripts/              # Automation scripts
├── references/           # Reference documentation
└── workflows/            # Step-by-step workflows
```

## Examples

### Example 1: Basic Usage

```bash
# Step 1: Initialize
/{{ plugin.command_prefix }}:{{ plugin.primary_command }} init

# Step 2: Execute main action
/{{ plugin.command_prefix }}:{{ plugin.primary_command }} run --arg1 value

# Step 3: Verify results
/{{ plugin.command_prefix }}:{{ plugin.primary_command }} status
```

### Example 2: Advanced Workflow

??? example "Click to expand"
    ```bash
    # Advanced multi-step workflow
    /{{ plugin.command_prefix }}:{{ plugin.primary_command }} configure --advanced
    /{{ plugin.command_prefix }}:{{ plugin.primary_command }} validate
    /{{ plugin.command_prefix }}:{{ plugin.primary_command }} execute --parallel
    /{{ plugin.command_prefix }}:{{ plugin.primary_command }} report --format json
    ```

## Configuration

### Plugin Settings

| Setting | Type | Default | Description |
|:--------|:-----|:--------|:------------|
| `setting1` | `string` | `"default"` | What this setting controls |
| `setting2` | `boolean` | `true` | What this setting controls |
| `setting3` | `number` | `30` | What this setting controls (seconds) |

### Metadata Configuration

??? abstract "console-navigation-metadata.json"
    ```json
    {
      "version": "{{ metadata.version }}",
      "deterministic_navigation": {
        "enabled": true,
        "selector_priority": ["data_testid", "aria_label", "text_match", "css", "ref"]
      }
    }
    ```

## Troubleshooting

??? danger "Connection Failed"
    **Problem:** Unable to connect to service

    **Symptoms:**
    - Timeout errors
    - Connection refused

    **Solutions:**
    1. Check network connectivity
    2. Verify credentials are correct
    3. Ensure required services are running

    ```bash
    # Diagnostic command
    /{{ plugin.command_prefix }}:{{ plugin.primary_command }} diagnose
    ```

??? warning "Authentication Error"
    **Problem:** Authentication fails

    **Solutions:**
    1. Verify environment variables are set
    2. Check token expiration
    3. Regenerate credentials if needed

??? note "Performance Issues"
    **Problem:** Slow execution

    **Solutions:**
    1. Check selector chain efficiency
    2. Use stable selectors (`data_testid`) over session refs
    3. Enable caching if available

## API Reference

??? info "Metadata Schema"
    ```json
    {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["version", "tenant"],
      "properties": {
        "version": { "type": "string" },
        "tenant": { "type": "string" },
        "last_crawled": { "type": "string", "format": "date-time" }
      }
    }
    ```

## Changelog

??? abstract "Version History"
    | Version | Date | Changes |
    |:--------|:-----|:--------|
    | `{{ plugin.version }}` | {{ plugin.release_date }} | Current release |
    | `0.2.0` | 2025-01-01 | Added feature X |
    | `0.1.0` | 2024-12-01 | Initial release |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Development setup
git clone https://github.com/{{ plugin.repo }}.git
cd {{ plugin.name }}
# Make changes and submit PR
```

## License

This project is licensed under the {{ plugin.license }} License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[Report Issue](https://github.com/{{ plugin.repo }}/issues)** | **[Request Feature](https://github.com/{{ plugin.repo }}/issues/new)** | **[Documentation](https://github.com/{{ plugin.repo }}#readme)**

Made with :heart: by [{{ plugin.author.name }}]({{ plugin.author.url }})

</div>
