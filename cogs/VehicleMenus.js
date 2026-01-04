// ═══════════════════════════════════════════════════════════
//  VEHICLE MENUS MODULE
//  Enhanced vehicle management system for FS Status Bot
// ═══════════════════════════════════════════════════════════

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class VehicleMenus {
    constructor(messageHandler = null) {
        this.msg = messageHandler;
    }

    getText(key, variables = {}, guildConfig = null) {
        if (this.msg) {
            return this.msg.get(key, variables, null, guildConfig);
        }
        return key.split('.').pop();
    }

    /**
     * Main Menu - Entry point for /vehicles command
     */
    createMainMenu(vehicleData, gcfg = null) {
        const embed = new EmbedBuilder()
            .setColor('#FF8C00')
            .setTitle('🚜 VEHICLE MANAGEMENT')
            .setDescription('Choose an option from the menu below:')
            .addFields(
                {
                    name: '📊 Fleet Overview',
                    value: `Total Vehicles: **${vehicleData.total}**\nTotal Value: **€${vehicleData.totalValue.toLocaleString()}**`,
                    inline: false
                }
            );

        return embed;
    }

    createMainMenuSelect(gcfg = null) {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('vehicles_main_menu')
                    .setPlaceholder('🚜 Choose an option...')
                    .addOptions([
                        {
                            label: 'Fleet Statistics',
                            description: 'Detailed breakdown of your fleet',
                            value: 'fleet_stats',
                            emoji: '📊'
                        },
                        {
                            label: 'Top 5 Vehicles',
                            description: 'Most valuable vehicles',
                            value: 'top5',
                            emoji: '🏆'
                        },
                        {
                            label: 'Value Breakdown',
                            description: 'Value distribution by category',
                            value: 'value_breakdown',
                            emoji: '📈'
                        },
                        {
                            label: 'Farm Overview',
                            description: 'Vehicles by farm',
                            value: 'farm_overview',
                            emoji: '🏠'
                        }
                    ])
            );
    }

    /**
     * Fleet Statistics
     */
    createFleetStats(vehicleData, gcfg = null) {
        const avgValue = vehicleData.total > 0 ? Math.round(vehicleData.totalValue / vehicleData.total) : 0;
        const avgHours = vehicleData.total > 0 ? Math.round(vehicleData.totalOperatingHours / vehicleData.total) : 0;

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📊 FLEET STATISTICS')
            .addFields(
                {
                    name: '🚜 Overview',
                    value: `Total Vehicles: **${vehicleData.total}**\nTotal Value: **€${vehicleData.totalValue.toLocaleString()}**\nOperating Hours: **${Math.round(vehicleData.totalOperatingHours)}h**`,
                    inline: false
                },
                {
                    name: '📈 Averages',
                    value: `Avg. Value: **€${avgValue.toLocaleString()}**\nAvg. Hours: **${avgHours}h**`,
                    inline: false
                }
            );

        // Add category breakdown
        if (Object.keys(vehicleData.categories).length > 0) {
            const categoryList = Object.entries(vehicleData.categories)
                .sort(([,a], [,b]) => b - a)
                .map(([cat, count]) => {
                    const icon = this.getCategoryIcon(cat);
                    const name = this.getCategoryName(cat);
                    return `${icon} ${name}: ${count}`;
                })
                .join('\n');

            embed.addFields({
                name: '📋 Category Breakdown',
                value: categoryList,
                inline: false
            });
        }

        return embed;
    }

    /**
     * Top 5 Most Valuable Vehicles
     */
    createTop5(vehicleData, gcfg = null) {
        const top5 = [...vehicleData.vehicles]
            .sort((a, b) => b.price - a.price)
            .slice(0, 5);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 TOP 5 MOST VALUABLE VEHICLES');

        if (top5.length === 0) {
            embed.setDescription('No vehicles found!');
            return embed;
        }

        top5.forEach((vehicle, index) => {
            const icon = this.getCategoryIcon(vehicle.category);
            embed.addFields({
                name: `${index + 1}. ${icon} ${vehicle.name}`,
                value: `💰 €${vehicle.price.toLocaleString()}\n⏱️ ${Math.round(vehicle.operatingTime)}h`,
                inline: true
            });
        });

        return embed;
    }

    /**
     * Value Breakdown by Category
     */
    createValueBreakdown(vehicleData, gcfg = null) {
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('📈 VALUE BREAKDOWN');

        // Calculate value by category
        const categoryValues = {};
        vehicleData.vehicles.forEach(v => {
            if (!categoryValues[v.category]) {
                categoryValues[v.category] = 0;
            }
            categoryValues[v.category] += v.price;
        });

        const sortedCategories = Object.entries(categoryValues)
            .sort(([,a], [,b]) => b - a);

        if (sortedCategories.length === 0) {
            embed.setDescription('No data available!');
            return embed;
        }

        sortedCategories.forEach(([cat, value]) => {
            const icon = this.getCategoryIcon(cat);
            const name = this.getCategoryName(cat);
            const count = vehicleData.categories[cat] || 0;
            const percentage = ((value / vehicleData.totalValue) * 100).toFixed(1);

            embed.addFields({
                name: `${icon} ${name}`,
                value: `💰 €${value.toLocaleString()} (${percentage}%)\n🚜 ${count} vehicle${count !== 1 ? 's' : ''}`,
                inline: true
            });
        });

        return embed;
    }

    /**
     * Farm Overview
     */
    createFarmOverview(vehicleData, farmNames, gcfg = null) {
        const embed = new EmbedBuilder()
            .setColor('#8B4513')
            .setTitle('🏠 FARM OVERVIEW')
            .setDescription('Vehicles distributed across your farms:');

        Object.entries(vehicleData.farms).forEach(([farmId, farm]) => {
            const farmName = farmNames[farmId] || `Farm ${farmId}`;
            embed.addFields({
                name: `🏠 ${farmName}`,
                value: `🚜 Vehicles: ${farm.count}\n💰 Value: €${farm.totalValue.toLocaleString()}\n⏱️ Hours: ${Math.round(farm.totalOperatingHours)}h`,
                inline: true
            });
        });

        return embed;
    }

    /**
     * Farm Selection Menu
     */
    createFarmSelect(vehicleData, farmNames, gcfg = null) {
        const options = Object.entries(vehicleData.farms).map(([farmId, farm]) => {
            const farmName = farmNames[farmId] || `Farm ${farmId}`;
            return {
                label: farmName,
                description: `${farm.count} vehicles - €${farm.totalValue.toLocaleString()}`,
                value: farmId,
                emoji: '🏠'
            };
        });

        options.push({
            label: '← Back to Main Menu',
            value: 'back',
            emoji: '↩️'
        });

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('vehicles_farm_select')
                    .setPlaceholder('🏠 Choose a farm...')
                    .addOptions(options)
            );
    }

    /**
     * Farm Details
     */
    createFarmDetails(farmId, vehicleData, farmNames, gcfg = null) {
        const farm = vehicleData.farms[farmId];
        const farmName = farmNames[farmId] || `Farm ${farmId}`;

        const embed = new EmbedBuilder()
            .setColor('#228B22')
            .setTitle(`🏠 ${farmName}`)
            .addFields(
                {
                    name: '📊 Overview',
                    value: `🚜 Vehicles: **${farm.count}**\n💰 Total Value: **€${farm.totalValue.toLocaleString()}**\n⏱️ Operating Hours: **${Math.round(farm.totalOperatingHours)}h**`,
                    inline: false
                }
            );

        // Top 3 vehicles in this farm
        const top3 = [...farm.vehicles]
            .sort((a, b) => b.price - a.price)
            .slice(0, 3);

        if (top3.length > 0) {
            const top3List = top3.map((v, i) => {
                const icon = this.getCategoryIcon(v.category);
                return `${i + 1}. ${icon} ${v.name} - €${v.price.toLocaleString()}`;
            }).join('\n');

            embed.addFields({
                name: '🏆 Top Vehicles',
                value: top3List,
                inline: false
            });
        }

        return embed;
    }

    /**
     * Back Button Row
     */
    createBackButton(backTo = 'main') {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`vehicles_back_${backTo}`)
                    .setPlaceholder('↩️ Back...')
                    .addOptions([
                        {
                            label: '← Back to Main Menu',
                            value: 'main',
                            emoji: '↩️'
                        }
                    ])
            );
    }

    /**
     * Helper: Get category icon
     */
    getCategoryIcon(category) {
        const icons = {
            'tractors': '🚜',
            'harvesters': '🌾',
            'trucks': '🚛',
            'trailers': '🚚',
            'cultivation': '🌱',
            'spraying': '💧',
            'forage': '🌿',
            'loading': '🏗️',
            'other': '🔧'
        };
        return icons[category] || '🔧';
    }

    /**
     * Helper: Get category name
     */
    getCategoryName(category) {
        const names = {
            'tractors': 'Tractors',
            'harvesters': 'Harvesters',
            'trucks': 'Trucks',
            'trailers': 'Trailers',
            'cultivation': 'Cultivation',
            'spraying': 'Spraying',
            'forage': 'Forage',
            'loading': 'Loading',
            'other': 'Other'
        };
        return names[category] || 'Other';
    }
}

module.exports = { VehicleMenus };