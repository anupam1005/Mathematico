# Vercel Environment Variables Checklist

## Required Environment Variables for Production

Make sure these are set in your Vercel project settings:

### Database
- `MONGODB_URI` = `mongodb+srv://anupamdas0515_db_user:8bO4aEEQ2TYAfCSu@mathematico-app.vszbcc9.mongodb.net/?retryWrites=true&w=majority&appName=Mathematico-app`

### Authentication
- `JWT_SECRET` = `ea8d2dd209821c788f00430dbada14059f8729cdb9787927fc66d4b614ce934d8a605ca223405bddd2b4c984ed8490c7c62550d579f1b245754ee2f0c6e6fe33`
- `JWT_REFRESH_SECRET` = `4f5093c4703da4e343a60514af3d606f885386828349a58d2cec5c6d66bb829b373361b340518abc1011e697cecd71dfcad0a32cc4a1e05a167e11076877f090`
- `JWT_ACCESS_EXPIRES_IN` = `1d`
- `JWT_REFRESH_EXPIRES_IN` = `7d`

### Admin Credentials
- `ADMIN_EMAIL` = `dc2006089@gmail.com`
- `ADMIN_PASSWORD` = `Myname*321`

### Backend URLs
- `BACKEND_URL` = `https://mathematico-backend-new.vercel.app`
- `MOBILE_API_URL` = `https://mathematico-backend-new.vercel.app/api/v1`

### Cloudinary (File Uploads)
- `CLOUDINARY_CLOUD_NAME` = `duxjf7v40`
- `CLOUDINARY_API_KEY` = `691967822927518`
- `CLOUDINARY_API_SECRET` = `M5LspD_XGt5DtI_0XPQ5DKz3awA`

### CORS
- `CORS_ORIGIN` = `https://mathematico-frontend.vercel.app,https://mathematico-app.vercel.app`

### Email (Optional)
- `EMAIL_USER` = `sirramanujan@gmail.com`
- `EMAIL_PASSWORD` = `lfwdvspfszgfnybl`
- `EMAIL_FROM` = `Mathematico <noreply@mathematico.com>`

### Razorpay (Optional)
- `RAZORPAY_KEY_ID` = `rzp_test_REPhtJhKrjuo5z`
- `RAZORPAY_KEY_SECRET` = `t1raXTc3z6pRiesvTnNnQCaF`

### Server Configuration
- `PORT` = `5000`
- `NODE_ENV` = `production`
- `API_PREFIX` = `/api/v1`
- `VERCEL` = `1`

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the exact name and value from this list
5. Make sure to set them for Production environment
6. Redeploy your project

## Testing Commands

After setting environment variables, test with:

```bash
# Test health endpoint
curl https://mathematico-backend-new.vercel.app/health

# Test admin login
curl -X POST https://mathematico-backend-new.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dc2006089@gmail.com","password":"Myname*321"}'

# Test admin routes (replace YOUR_TOKEN with actual token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://mathematico-backend-new.vercel.app/api/v1/admin/books
```
