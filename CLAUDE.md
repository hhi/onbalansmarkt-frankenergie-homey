# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Homey home automation solution for reporting battery trading results to onbalansmarkt.com (Dutch energy balance market). The system integrates Frank Energie smart trading with multiple home battery systems through Homey Advanced Flows.

## Core Architecture

### Main Components

1. **homey-onbalansmarkt-frankenergie.js** - Primary script that:
   - Authenticates with Frank Energie GraphQL API 
   - Retrieves battery trading session data
   - Aggregates results across multiple batteries
   - Determines trading mode automatically based on battery settings
   - Sends measurements to Onbalansmarkt API

2. **Battery Setup Scripts** - Configure device capabilities per battery brand:
   - `sessy-setup.js` - Sessy battery configuration
   - `alphaESS-setup.js` - AlphaESS battery configuration  
   - `sigEnergy-setup.js` - SolarEdge SigEnergy configuration

3. **Data Processing Scripts**:
   - `battery-calculate-averages.js` - Calculates averages across multiple batteries
   - `battery-update-deltas.js` - Calculates daily delta values for systems that only provide cumulative totals
   - `battery-update-prevs.js` - Stores previous day values for delta calculations

4. **API Classes**:
   - `FrankEnergie` - GraphQL API client for Frank Energie
   - `OnbalansMarkt` - REST API client for reporting measurements
   - `HomeyVars` - Homey global variable management

### Battery System Support

The system supports multiple battery brands through configurable device capabilities:

| System | Battery % | kWh Import | kWh Export | Driver ID | Class | Delta Processing |
|--------|-----------|------------|------------|-----------|-------|------------------|
| Sessy | measure_battery | meter_power.import | meter_power.export | sessy | battery | Yes |
| AlphaESS | measure_battery | meter_power.charged | meter_power.discharged | alphaess | battery | Yes |
| SolarEdge variants | measure_battery | varies by model | varies by model | varies | solarpanel | varies |

### Trading Mode Determination

Trading modes are automatically determined from Frank Energie API:

| Battery Mode | Trading Strategy | Resulting Mode |
|--------------|------------------|----------------|
| IMBALANCE_TRADING | STANDARD | imbalance |
| IMBALANCE_TRADING | AGGRESSIVE | imbalance_aggressive |
| SELF_CONSUMPTION_MIX | - | self_consumption_plus |
| Other | - | manual |

## Development Workflow

### Required Homey Global Variables
- `frankenergie_id` - Frank Energie login email
- `frankenergie_pw` - Frank Energie password  
- `onbalansmarkt_apikey` - Onbalansmarkt API key
- Battery system configuration variables (set by setup scripts)
- Calculated averages and deltas (managed by processing scripts)

### Homey Advanced Flow Structure
1. Scheduled trigger (e.g., every 15 minutes)
2. Battery system setup script (brand-specific)
3. Battery data calculation and delta processing
4. Main reporting script execution

### Adding New Battery Systems
1. Create new `{brand}-setup.js` file based on existing examples
2. Configure battery system variables:
   - `battery_system` - driver identifier
   - `battery_class` - device class ('battery' or 'solarpanel')
   - `battery_import`, `battery_export`, `battery_level` - capability names
   - `battery_delta` - 'Yes' if daily deltas needed, 'No' for systems with built-in daily totals

### Key Data Flow
1. Setup script configures battery system parameters
2. Calculate averages across all batteries of the configured type
3. Update deltas for systems requiring daily calculations
4. Main script authenticates, retrieves trading data, and reports to Onbalansmarkt

## Important Considerations

- Scripts are designed for Homey's JavaScript environment (no Node.js modules)
- Authentication credentials are stored as Homey global variables for security
- System supports multiple batteries of the same type with automatic aggregation
- Delta processing is required for systems that only provide cumulative energy totals
- Trading mode is automatically determined from Frank Energie battery settings