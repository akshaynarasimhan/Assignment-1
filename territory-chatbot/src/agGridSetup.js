import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise';

// Register all community and enterprise modules globally
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

// Set a trial/invalid license key - shows watermark in dev but works for prototyping
// Replace with a real key for production use
LicenseManager.setLicenseKey('');
