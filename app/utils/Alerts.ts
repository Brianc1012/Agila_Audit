import Swal from 'sweetalert2';

//--------------------ADD REVENUE RECORD-------------------//
export const showEmptyFieldWarning = () => {
  return Swal.fire({
    icon: 'warning',
    text: 'Please fill out all fields.',
    confirmButtonColor: '#961C1E',
    background: 'white',
    backdrop: false,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};

export const showInvalidCategoryAlert = () => {
    return Swal.fire({
      icon: 'error',
      title: 'Invalid Category',
      text: 'Please select a valid category.',
      confirmButtonColor: '#961C1E',
      background: 'white',
      backdrop: false,
      customClass: {
    popup: 'swal-custom-popup'
  }
    });
  };
  
export const showInvalidSourceAlert = () => {
  return Swal.fire({
    icon: 'error',
    title: 'Invalid Source',
    text: 'Source must be 3-50 alphabetic characters.',
    confirmButtonColor: '#961C1E',
    background: 'white',
    backdrop: false,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};

export const showInvalidAmountAlert = () => {
  return Swal.fire({
    icon: 'error',
    title: 'Invalid Amount',
    text: 'Amount must be a positive number.',
    confirmButtonColor: '#961C1E',
    background: 'white',
    backdrop: false,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
}

export const showAddConfirmation = () => {
  return Swal.fire({
    title: 'Confirmation',
    html: `<p>Are you sure you want to <b>ADD</b> this record?</p>`,
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    background: 'white',
    confirmButtonColor: '#961C1E',
    cancelButtonColor: '#ECECEC',
    backdrop: false,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};

export const showAddSuccess = () => {
  return Swal.fire({
    icon: 'success',
    title: 'Added!',
    text: 'Your revenue record has been added.',
    confirmButtonColor: '#961C1E',
    background: 'white',
    backdrop: false,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};


//-----------------------ADD RECORD---------------------//
//SUCCESS
export const showSuccess = (message: string, title:string) => {
  Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonColor: '#961C1E',
    background: 'white',
    backdrop: false,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};

//FAILED/ERROR

export const showError = (message: string, title: string) => {
  Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#961C1E',
    background: 'white',
    timer: 3000,
    backdrop: false,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};

//WARNING
export const showWarning = (message: string) => {
  return Swal.fire({
    icon: 'warning',
    text: message,
    confirmButtonColor: '#961C1E',
    background: 'white',
    backdrop: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};

//Information
export const showInformation = (message: string, title: string) => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonColor: '#961C1E',
    background: 'white',
    backdrop: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};

//confirmation
export const showConfirmation = (message: string, title: string) => {
  return Swal.fire({
    icon: 'question',
    title: title,
    html: message,
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    background: 'white',
    confirmButtonColor: '#961C1E',
    cancelButtonColor: '#FEB71F',
    reverseButtons: true,
    customClass: {
    popup: 'swal-custom-popup'
  }
  });
};



