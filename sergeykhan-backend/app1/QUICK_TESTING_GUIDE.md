# 🧪 Quick Testing Guide - Master Workload Feature

## 🚀 Quick Start

### 1. Verify Servers are Running

**Backend (Django)**
```bash
# Check if running
curl -I http://127.0.0.1:8000/api/masters/workload/all/
# Should return: HTTP/1.1 401 Unauthorized (this is correct - means server is running)

# If not running, start it:
cd /Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1
python3 manage.py runserver
```

**Frontend (React)**  
```bash
# Check if running
curl -I http://localhost:3000/
# Should return: HTTP/1.1 200 OK

# If not running, start it:
cd /Users/bekzhan/Documents/projects/soso/sergeykhan-frontend
pnpm run dev
```

### 2. Access the Feature

1. **Open Curator Panel**: http://localhost:3000
2. **Login as curator or super-admin**
3. **Navigate to**:
   - "Рабочая нагрузка мастеров" → Master workload management
   - "Создать заказ с расписанием" → Create scheduled orders

### 3. Test Key Functionality

#### Master Workload Table
- ✅ View all masters and their current workload
- ✅ See availability slots and scheduled orders
- ✅ Filter by master, date, or status
- ✅ Sort columns by clicking headers

#### Master Availability Calendar  
- ✅ Select a master from dropdown
- ✅ Click on calendar dates to add availability slots
- ✅ Set start/end times for availability
- ✅ Edit or delete existing slots
- ✅ View availability in calendar format

#### Enhanced Order Creation
- ✅ Fill out standard order form
- ✅ Select master and scheduling details
- ✅ Validate availability automatically
- ✅ Get conflict notifications
- ✅ Create orders with scheduling

## 🔍 Expected Results

### ✅ Working Features
1. **Authentication**: Only curators/super-admins can access
2. **Data Loading**: Tables and calendars load master data
3. **CRUD Operations**: Create, read, update, delete availability slots
4. **Validation**: Prevent overlapping time slots
5. **Scheduling**: Create orders with specific master/time assignments
6. **Real-time Updates**: Changes reflect immediately in UI

### ❌ Troubleshooting
If something doesn't work:
1. Check browser console for errors
2. Verify authentication token in localStorage
3. Ensure both servers are running
4. Check API responses in Network tab

## 🎯 Success Criteria

Feature is working correctly when:
- ✅ Can view master workload table with data
- ✅ Can add/edit/delete availability slots in calendar
- ✅ Can create orders with scheduling validation
- ✅ No console errors or failed API calls
- ✅ UI responds smoothly to user interactions

## 📞 Ready for Production!

If all tests pass, the Master Workload feature is ready for production use!
