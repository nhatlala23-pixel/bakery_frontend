import axiosClient from './axiosClient';

export interface ContactSettingDTO {
  zaloUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  hotline?: string;
  email?: string;
  address?: string;
  googleMaps?: string;
  openingHours?: string;
  logoUrl?: string;
}

const contactSettingService = {
  getContactSetting: async (): Promise<ContactSettingDTO> => {
    return await axiosClient.get('/contact-settings');
  },

  updateContactSetting: async (dto: ContactSettingDTO): Promise<ContactSettingDTO> => {
    return await axiosClient.put('/contact-settings', dto);
  }
};

export default contactSettingService;
