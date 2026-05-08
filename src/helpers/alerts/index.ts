import Swal from "sweetalert2";
import { SweetAlertIcon } from "sweetalert2";

export interface AlertActionCallback {
  (): void;
}

export interface AlertOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;       // success | error | info | warning | question
  showCancelButton?: boolean;

  confirmButtonText?: string;
  cancelButtonText?: string;

  confirmButtonClass?: string;
  cancelButtonClass?: string;

  onConfirm?: AlertActionCallback;
  onCancel?: AlertActionCallback;

  customClass?: {
    popup?: string;
    htmlContainer?: string;
    actions?: string;
    confirmButton?: string;
    cancelButton?: string;
    [key: string]: any;  // allows expansion
  };
}


export const showAlert = (options: AlertOptions = {}) => {
  const {
    title = "Alert",
    text,
    html,
    icon = "info",
    showCancelButton = false,

    confirmButtonText = "OK",
    cancelButtonText = "Cancel",

    confirmButtonClass = "btn btn-light-info btn-alert me-2",
    cancelButtonClass = "btn btn-light-danger btn-alert",

    onConfirm,
    onCancel,
    customClass = {},
  } = options;

  return Swal.fire({
    title,
    text,
    html,
    icon,
    showCancelButton,

    confirmButtonText,
    cancelButtonText,

    customClass: {
      popup: "my-swal-popup card",
      htmlContainer: "my-swal-body",
      actions: "my-action-row",

      confirmButton: confirmButtonClass,
      cancelButton: cancelButtonClass,

      ...customClass,
    },

    buttonsStyling: false,
  }).then((result) => {
    if (result.isConfirmed && typeof onConfirm === "function") {
      onConfirm();
    }
    if (result.isDismissed && typeof onCancel === "function") {
      onCancel();
    }
  });
};
