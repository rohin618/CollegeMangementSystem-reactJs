export const getDocumentHeader = (logoBase64: any, companyDetails: any) => {
  return `
    <div style="
      width: 100%;
      box-sizing: border-box;
      padding: 10px 20px 8px 20px;
      margin: 0;
      display: flex;
      justify-content: space-between;
      align-items: center; 
      border-bottom: 1px solid #e5e5e5;
      position: relative;
    ">
      <div style="display:flex; align-items:center; gap:8px;">
        <img
          src="${logoBase64 || ''}"
          alt="Company Logo"
          style="
            height:50px;
            width:auto; 
            display:block;
          "
        />
        <p style="margin:0; font-size:13px; font-weight:600; color:#111;">
          ${companyDetails?.tradeName || ''}
        </p>
      </div>

      <div style="text-align:right;">
        <p style="margin:0; font-size:9px; color:#333; line-height:1.6;">
          ${companyDetails?.buildingNumber || ''} ${companyDetails?.area || ''}
        </p>
        <p style="margin:0; font-size:9px; color:#333; line-height:1.6;">
          ${companyDetails?.address || ''}
        </p>
        <p style="margin:0; font-size:9px; color:#333; line-height:1.6;">
          ${companyDetails?.postCode || ''}
        </p>
      </div>
    </div>
  `;
};