import React, { FC, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { Page, PageWrapper } from '../../../layout';
import { Button, Input, FormGroup, CardBody, Card } from '../../../components/bootstrap';
import Logo from '../../../components/Logo';
import { setStorage, showAlert } from '../../../helpers/helpers';
import { EXIST_SESSION_STORAGE_NAMES, USER_STATUS } from '../../../common/constant';
import SimpleReactValidator from 'simple-react-validator';
import { useAuth } from '../../../contexts/authContext';

interface ILoginProps {
	isSignUp?: boolean;
}

const Login: FC<ILoginProps> = () => {
	const navigate = useNavigate();
	const { logout } = useAuth();
	const [loginForm, setLoginForm] = useState({
		email: '',
		password: '',
	});
	const [isSubmited, setIsSubmited] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());

	useEffect(() => {
		localStorage.clear();
		sessionStorage.clear();

		handleLogout();
	}, []);

	const handleLogout = async () => {
		await logout();
	};

	// Handle input change
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setLoginForm((prev) => ({ ...prev, [id]: value }));
	};
const { login } = useAuth();
	// Handle form submit
const handleSubmit = async (e: React.FormEvent) => {
	try {
		e.preventDefault();

		setIsSubmited(true);

		const isValid = validator.current.allValid();

		if (!isValid) {
			validator.current.showMessages();
			return;
		}

		setIsLoading(true);

		const success = await login(
			loginForm.email,
			loginForm.password,
		);

		if (success) {
			navigate('/dashboard', { replace: true });
		} else {
			showAlert({
				title: 'Login Failed',
				text: 'Invalid email or password',
				icon: 'error',
			});
		}
	} catch (e) {
		console.error(e);
	} finally {
		setIsLoading(false);
	}
};

	return (
		<PageWrapper isProtected={false} title='Login' className='light'>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center'>
					<div className='col-xl-4 col-lg-6 col-md-8 shadow-3d-container'>
						<Card className='' data-tour='login-page'>
							<CardBody>
								{/* Logo */}
								{/* College Title */}
						<div className='text-center my-5'>
							<h1 className='fw-bold text-dark mb-2'>
								College Management System
							</h1>

							<p className='text-muted fs-5 mb-0'>
								Sign in to continue
							</p>
						</div>

								{/* Login Form */}
								<form className='row g-4' onSubmit={handleSubmit}>
									<div className='col-12'>
										<FormGroup
											id='email'
											isFloating
											label='Your email or username'
											className='mb-4'>
											<Input
												id='email'
												value={loginForm.email}
												onChange={handleChange}
												autoComplete='username'
												isValid={validator.current.fieldValid('Email')}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													'Email',
													loginForm.email,
													'required|email',
												)}
											/>
										</FormGroup>

										<FormGroup id='password' isFloating label='Password'>
											<Input
												id='password'
												type='password'
												value={loginForm.password}
												onChange={handleChange}
												autoComplete='current-password'
												isValid={validator.current.fieldValid('Password')}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													'Password',
													loginForm.password,
													'required',
												)}
											/>
										</FormGroup>
									</div>

									<div className='col-12'>
										<Button
											color='warning'
											className='w-100 py-3'
											type='submit'
											isLoading={isLoading}>
											Login
										</Button>
									</div>
								</form>
							</CardBody>
						</Card>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Login;
