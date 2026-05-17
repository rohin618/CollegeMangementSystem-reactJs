import React, { FC, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, PageWrapper } from '../../../layout';
import { Button, Input, FormGroup, CardBody, Card } from '../../../components/bootstrap';
import { showAlert } from '../../../helpers/helpers';
import SimpleReactValidator from 'simple-react-validator';
import { useAuth } from '../../../contexts/authContext';

interface ILoginProps {
	isSignUp?: boolean;
}

const Login: FC<ILoginProps> = () => {
	const navigate = useNavigate();
	const { logout, login } = useAuth();

	const [loginForm, setLoginForm] = useState({
		username: '',
		password: '',
	});

	const [isSubmited, setIsSubmited] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());



	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setLoginForm((prev) => ({ ...prev, [id]: value }));
	};

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
				loginForm.username,
				loginForm.password,
			);

			if (success) {
				navigate('/dashboard', { replace: true });
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
						<Card data-tour='login-page'>
							<CardBody>
					<div className='text-center my-4'>
	<h1
		className='fw-bolder text-primary mb-2'
		style={{
			fontSize: '2.5rem',
			letterSpacing: '-0.5px',
		}}>
		College Management System
	</h1>

	<p
		className='text-secondary mb-4 fw-medium'
		style={{
			fontSize: '1rem',
		}}>
		Manage students, faculty, academics, and administration
	</p>

	<div className='mb-4'>
		<img
			src='../../../.././college-logo.jpg'
			alt='College Management'
			className='img-fluid rounded-3 border'
			style={{
				width: '100px',
				height: 'auto',
				objectFit: 'cover',
			}}
		/>
	</div>
</div>

								<form className='row g-4' onSubmit={handleSubmit}>
									<div className='col-12'>
										<FormGroup
											id='username'
											isFloating
											label='Username'
											className='mb-4'>
											<Input
												id='username'
												value={loginForm.username}
												onChange={handleChange}
												autoComplete='username'
												isValid={validator.current.fieldValid('Username')}
												isTouched={isSubmited}
												invalidFeedback={validator.current.message(
													'Username',
													loginForm.username,
													'required',
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