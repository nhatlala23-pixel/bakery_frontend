import axiosClient from "./axiosClient";
import { type PageResponse } from "./productService";

export interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
}

const contactService = {
  submitContact: (data: ContactRequest): Promise<ContactResponse> => {
    return axiosClient.post('/contacts', data);
  },

  getAllContacts: (page = 0, size = 10, status?: string, search?: string): Promise<PageResponse<ContactResponse>> => {
    return axiosClient.get("/contacts", {
      params: { page, size, status, search },
    });
  },

  getContactById: (id: number): Promise<ContactResponse> => {
    return axiosClient.get(`/contacts/${id}`);
  },

  updateStatus: (id: number, status: string): Promise<ContactResponse> => {
    return axiosClient.put(`/contacts/${id}/status`, null, {
      params: { status }
    });
  },

  replyContact: (id: number, replyMessage: string): Promise<ContactResponse> => {
    return axiosClient.post(`/contacts/${id}/reply`, { replyMessage });
  },

  deleteContact: (id: number): Promise<void> => {
    return axiosClient.delete(`/contacts/${id}`);
  }
};

export default contactService;
