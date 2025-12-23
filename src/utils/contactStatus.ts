import { API_BASE_URL } from '../config';

/**
 * Checks if a contact is marked as paid
 * @param {string} contactId - The ID of the contact to check
 * @returns {Promise<boolean>} - Returns true if the contact is paid, false otherwise
 */
export async function isContactPaid(contactId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}/status`);
    if (!response.ok) {
      console.error('Failed to fetch contact status:', response.statusText);
      return false; // Default to false if we can't determine the status
    }
    
    const data = await response.json();
    return data.isPaid === true;
  } catch (error) {
    console.error('Error checking contact payment status:', error);
    return false; // Default to false on error
  }
}

/**
 * Checks if any of the provided contacts are marked as paid
 * @param {string[]} contactIds - Array of contact IDs to check
 * @returns {Promise<{allPaid: boolean, paidContactIds: string[]}>} - Returns whether all contacts are paid and which ones are paid
 */
export async function checkContactsPaymentStatus(contactIds: string[]): Promise<{allPaid: boolean, paidContactIds: string[]}> {
  if (!contactIds || contactIds.length === 0) {
    return { allPaid: false, paidContactIds: [] };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/contacts/status/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contactIds })
    });

    if (!response.ok) {
      console.error('Failed to fetch bulk contact status:', response.statusText);
      return { allPaid: false, paidContactIds: [] };
    }

    const data = await response.json();
    const paidContactIds = data.filter((contact: any) => contact.isPaid).map((c: any) => c.id);
    
    return {
      allPaid: paidContactIds.length === contactIds.length,
      paidContactIds
    };
  } catch (error) {
    console.error('Error checking bulk contact payment status:', error);
    return { allPaid: false, paidContactIds: [] };
  }
}
