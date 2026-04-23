const LOCAL_RESOURCES_CONFIG = {
    population: {
        id: 'population',
        name: '人口',
        buildingFilter: (bKey, cfg, bld) => true,
        provideKey: 'providesLocal',
        requireKey: 'requiresLocal',
        displayLocation: 'global',
    },
    space_habitat: {
        id: 'space_habitat',
        name: '太空宜居度',
        buildingFilter: (bKey, cfg) => cfg.class === 'space',
        provideKey: 'providesLocal',
        requireKey: 'requiresLocal',
        displayLocation: 'space',
    },
    moon_habitat: {
        id: 'moon_habitat',
        name: '月球宜居度',
        buildingFilter: (bKey, cfg) => cfg.type === '月球',
        provideKey: 'providesLocal',
        requireKey: 'requiresLocal',
        displayLocation: '月球',
    },
    gas_habitat: {
        id: 'gas_habitat',
        name: '气态行星宜居度',
        buildingFilter: (bKey, cfg) => cfg.type === '气态行星',
        provideKey: 'providesLocal',
        requireKey: 'requiresLocal',
        displayLocation: '气态行星',
    },
};
window.LOCAL_RESOURCES_CONFIG = LOCAL_RESOURCES_CONFIG;