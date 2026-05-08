import React, { useState, useRef } from 'react';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalHeader,
} from '../../../../../components/bootstrap';
import SimpleReactValidator from 'simple-react-validator';
import { changePassword } from '../../../../../common/api/user';

interface ChangePasswordProps {
	onPasswordChanged?: () => void;
}
const validatePasswordRules = (password: string) => ({
	length: password.length >= 8,
	uppercase: /[A-Z]/.test(password),
	lowercase: /[a-z]/.test(password),
	number: /\d/.test(password),
	special: /[@$!%*?&]/.test(password),
});


export const ChangePassword: React.FC<ChangePasswordProps> = ({
	onPasswordChanged,
}) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [confirmError, setConfirmError] = useState('');

	const [form, setForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const [, forceUpdate] = useState(0);

	const validator = useRef(
		new SimpleReactValidator({
			autoForceUpdate: { forceUpdate },
		})
	);

	const passwordRules = validatePasswordRules(form.newPassword);

	/* ---------------- HANDLE CHANGE ---------------- */
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;

		setForm((prev) => ({ ...prev, [id]: value }));

		if (id === 'confirmPassword') {
			setConfirmError('');
		}
	};

	/* ---------------- HANDLE SUBMIT ---------------- */
	const handleSubmit = async () => {
		// 1️⃣ Required field validation
		if (!validator.current.allValid()) {
			validator.current.showMessages();
			forceUpdate((p) => p + 1);
			return;
		}

		// 2️⃣ Strong password rules
		if (Object.values(passwordRules).includes(false)) {
			return;
		}

		// 3️⃣ Confirm password match
		if (form.newPassword !== form.confirmPassword) {
			setConfirmError('Passwords do not match');
			return;
		}

		// 4️⃣ API call
		setIsLoading(true);
		try {
			const res = await changePassword(
				form.currentPassword,
				form.newPassword
			);

			if (res?.success) {
				setForm({
					currentPassword: '',
					newPassword: '',
					confirmPassword: '',
				});
				setConfirmError('');
				setIsModalOpen(false);
				onPasswordChanged?.();
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Card className="shadow-sm border-0 mb-3">
				<CardHeader className="fw-bold">Security</CardHeader>
				<CardBody>
					<h6>Password</h6>
					<p className="text-muted">
						Keep your account secure by using a strong password.
					</p>
					<Button color="primary" onClick={() => setIsModalOpen(true)}>
						Change Password
					</Button>
				</CardBody>
			</Card>

			<Modal isOpen={isModalOpen}
				toggle={() => setIsModalOpen(false)}
				setIsOpen={setIsModalOpen}>
				<ModalHeader onToggle={() => setIsModalOpen(false)}>
					Change Password
				</ModalHeader>

				<ModalBody>
					<FormGroup label="Current Password">
						<Input
							type="password"
							id="currentPassword"
							value={form.currentPassword}
							onChange={handleChange}
						/>
						<div className="text-danger small">
							{validator.current.message(
								'current password',
								form.currentPassword,
								'required'
							)}
						</div>
					</FormGroup>

					<FormGroup label="New Password">
						<Input
							type="password"
							id="newPassword"
							value={form.newPassword}
							onChange={handleChange}
						/>

						<div className="small mt-1">
							<div className={passwordRules.length ? 'text-success' : 'text-danger'}>
								• Minimum 8 characters
							</div>
							<div className={passwordRules.uppercase ? 'text-success' : 'text-danger'}>
								• At least 1 uppercase letter
							</div>
							<div className={passwordRules.lowercase ? 'text-success' : 'text-danger'}>
								• At least 1 lowercase letter
							</div>
							<div className={passwordRules.number ? 'text-success' : 'text-danger'}>
								• At least 1 number
							</div>
							<div className={passwordRules.special ? 'text-success' : 'text-danger'}>
								• At least 1 special character
							</div>
						</div>
					</FormGroup>

					<FormGroup label="Confirm Password">
						<Input
							type="password"
							id="confirmPassword"
							value={form.confirmPassword}
							onChange={handleChange}
						/>
						<div className='text-danger mt-1'>
							{validator.current.message(
								'confirm password',
								form.confirmPassword,
								`required|in:${form.newPassword}`,
							)}
						</div>
					</FormGroup>

					<div className="text-end mt-3">
						<Button
							color="primary"
							isLoading={isLoading}
							onClick={handleSubmit}
						>
							Update Password
						</Button>
						<Button
							color="dark"
							className="ms-2"
							onClick={() => setIsModalOpen(false)}
						>
							Close
						</Button>
					</div>
				</ModalBody>
			</Modal>
		</>
	);
};
